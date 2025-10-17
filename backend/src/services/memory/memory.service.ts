import { supabase, supabaseAdmin } from '../../config/supabase.config';
import { OpenAIService } from '../openai/openai.service';
import { LangFuseService } from '../langfuse/langfuse.service';
import { jobQueueService } from './job-queue.service';
import { cacheService } from '../cache/redis-cache.service';
import { MemoryConfig } from '../../config/memory.config';
import {
  ENRICHMENT_PROMPT,
  RELATION_DETECTION_PROMPT,
  CONTEXT_SYNTHESIS_PROMPT,
  WEEKLY_SUMMARY_PROMPT,
} from './memory.prompts';

export interface MemoryBlock {
  id?: string;
  user_id: string;
  block_type: 'chat_message' | 'journal_entry' | 'goal' | 'action_plan' | 'exercise' | 'reflection' | 'mood_checkin' | 'insight';
  source_feature: 'chat' | 'journal' | 'goals' | 'tools' | 'dashboard';
  source_id: string;
  content_text: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  emotional_tone?: string;
  themes?: string[];
  tags?: string[];
  privacy_level?: 'public' | 'private' | 'ai-only';
  crisis_flag?: boolean;
  sensitivity_flag?: boolean;
  exclude_from_memory?: boolean;
  relevance_score?: number;
}

export interface MemoryRelation {
  source_block_id: string;
  target_block_id: string;
  relation_type: 'supports' | 'addresses' | 'follows_up_on' | 'derived_from' | 'connected_to' | 'contradicts' | 'reinforces';
  strength?: number;
}

export interface RetrievalContext {
  query?: string;
  targetFeature: 'chat' | 'journal' | 'goals' | 'tools';
  currentTopic?: string;
  mood?: string;
  limit?: number;
  similarityThreshold?: number;
  excludeCrisis?: boolean;
}

export class MemoryService {
  private openaiService: OpenAIService;
  private langfuseService: LangFuseService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.langfuseService = new LangFuseService();
  }

  // =====================================================
  // 1. INGESTION - Store new memory blocks
  // =====================================================

  /**
   * ASYNC INGESTION (Non-Blocking)
   * Returns immediately after inserting minimal block
   * Enqueues enrichment for background processing
   */
  async ingestBlockAsync(block: MemoryBlock): Promise<any> {
    // Check if memory system is enabled
    if (!MemoryConfig.isSystemEnabled()) {
      return null;
    }

    // Check if memory is enabled for this user
    const memoryEnabled = await this.isMemoryEnabled(block.user_id, block.source_feature);
    if (!memoryEnabled) {
      return null;
    }

    try {
      // Get default privacy level
      const privacyLevel = block.privacy_level || await this.getDefaultPrivacyLevel(block.user_id);

      // Insert MINIMAL block immediately (no AI processing)
      const { data: minimalBlock, error } = await supabaseAdmin
        .from('memory_blocks')
        .insert({
          user_id: block.user_id,
          block_type: block.block_type,
          source_feature: block.source_feature,
          source_id: block.source_id,
          content_text: block.content_text,
          privacy_level: privacyLevel,
          status: 'pending_enrichment', // New status field
          exclude_from_memory: block.exclude_from_memory || false,
        })
        .select()
        .single();

      if (error) {
        if (MemoryConfig.isFailFastEnabled()) {
          throw error;
        }
        console.error('Memory ingestion error:', error);
        return null;
      }

      // Log to memory ledger (non-blocking)
      this.logOperation('create', block.user_id, minimalBlock.id, block.source_feature, {
        block_type: block.block_type,
        async: true,
      }).catch((err) => console.error('Ledger log error:', err));

      // Enqueue enrichment job for background processing
      if (MemoryConfig.isEnrichmentEnabled() || MemoryConfig.isEmbeddingEnabled()) {
        jobQueueService.enqueue('enrich_and_embed', block.user_id, {
          block_id: minimalBlock.id,
        }).catch((err) => console.error('Job enqueue error:', err));
      }

      // Invalidate user's context cache (async)
      cacheService.invalidatePattern(`context:${block.user_id}:*`)
        .catch((err) => console.error('Cache invalidation error:', err));

      return minimalBlock; // Return immediately ✅
    } catch (error) {
      console.error('Memory ingestion error:', error);
      if (MemoryConfig.isFailFastEnabled()) {
        throw error;
      }
      return null; // Graceful fallback
    }
  }

  /**
   * LEGACY SYNCHRONOUS INGESTION (Deprecated)
   * Use ingestBlockAsync() for new implementations
   * Kept for backward compatibility
   */
  async ingestBlock(block: MemoryBlock): Promise<any> {
    console.warn('ingestBlock() is deprecated. Use ingestBlockAsync() instead.');

    // Check if memory is enabled for this user
    const memoryEnabled = await this.isMemoryEnabled(block.user_id, block.source_feature);
    if (!memoryEnabled) {
      return null;
    }

    // Create LangFuse trace (optional - won't break if it fails)
    const trace = MemoryConfig.isLangfuseEnabled()
      ? await this.langfuseService.createTrace(
          'memory_ingest',
          block.user_id,
          { block_type: block.block_type, source_feature: block.source_feature }
        ).catch(() => null)
      : null;

    try {
      // Enrich the block with metadata
      const enrichedBlock = await this.enrichBlock(block);

      // Generate embedding
      const embedding = await this.openaiService.generateEmbedding(enrichedBlock.content_text);

      // Get default privacy level
      const privacyLevel = enrichedBlock.privacy_level || await this.getDefaultPrivacyLevel(block.user_id);

      // Insert block into database
      const { data: insertedBlock, error } = await supabaseAdmin
        .from('memory_blocks')
        .insert({
          user_id: enrichedBlock.user_id,
          block_type: enrichedBlock.block_type,
          source_feature: enrichedBlock.source_feature,
          source_id: enrichedBlock.source_id,
          content_text: enrichedBlock.content_text,
          summary: enrichedBlock.summary,
          sentiment: enrichedBlock.sentiment,
          emotional_tone: enrichedBlock.emotional_tone,
          themes: enrichedBlock.themes || [],
          tags: enrichedBlock.tags || [],
          privacy_level: privacyLevel,
          crisis_flag: enrichedBlock.crisis_flag || false,
          sensitivity_flag: enrichedBlock.sensitivity_flag || false,
          exclude_from_memory: enrichedBlock.exclude_from_memory || false,
          relevance_score: enrichedBlock.relevance_score || 0.5,
          embedding: JSON.stringify(embedding), // pgvector format
          status: 'active', // Already enriched
        })
        .select()
        .single();

      if (error) throw error;

      // Log to memory ledger
      await this.logOperation('create', block.user_id, insertedBlock.id, block.source_feature, {
        block_type: block.block_type,
      });

      // Detect and create relations to existing blocks
      await this.autoDetectRelations(insertedBlock);

      // Update trace only if it exists and has update method
      if (trace && typeof trace.update === 'function') {
        try {
          await trace.update({ output: { block_id: insertedBlock.id } });
        } catch (traceError) {
          // Ignore trace errors
        }
      }

      return insertedBlock;
    } catch (error) {
      console.error('Memory ingestion error:', error);
      // Update trace only if it exists and has update method
      if (trace && typeof trace.update === 'function') {
        try {
          await trace.update({ output: { error: String(error) }, level: 'ERROR' });
        } catch (traceError) {
          // Ignore trace errors
        }
      }
      return null;
    }
  }

  // =====================================================
  // 2. ENRICHMENT - Add metadata to blocks
  // =====================================================

  /**
   * Enrich and embed a block (for worker processing)
   * This is called by the worker, not by the API
   */
  async enrichAndEmbedBlock(blockId: string): Promise<void> {
    try {
      // Get the block
      const { data: block, error: blockError } = await supabaseAdmin
        .from('memory_blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (blockError || !block) {
        throw new Error(`Block not found: ${blockId}`);
      }

      // Enrich if enabled
      let enrichedData: any = {};
      if (MemoryConfig.isEnrichmentEnabled()) {
        try {
          const enriched = await this.enrichBlock(block);
          enrichedData = {
            summary: enriched.summary,
            sentiment: enriched.sentiment,
            emotional_tone: enriched.emotional_tone,
            themes: enriched.themes || [],
            tags: enriched.tags || [],
            crisis_flag: enriched.crisis_flag || false,
            sensitivity_flag: enriched.sensitivity_flag || false,
            relevance_score: enriched.relevance_score || 0.5,
          };
        } catch (error) {
          console.error('Enrichment failed, continuing with embedding:', error);
        }
      }

      // Generate embedding if enabled
      let embedding: any = null;
      if (MemoryConfig.isEmbeddingEnabled()) {
        try {
          embedding = await this.openaiService.generateEmbedding(block.content_text);
        } catch (error) {
          console.error('Embedding generation failed:', error);
          throw error; // Embedding is critical for search
        }
      }

      // Update block with enriched data and embedding
      const { error: updateError } = await supabaseAdmin
        .from('memory_blocks')
        .update({
          ...enrichedData,
          embedding: embedding ? JSON.stringify(embedding) : null,
          status: 'active', // Mark as enriched
        })
        .eq('id', blockId);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Enriched and embedded block ${blockId}`);
    } catch (error) {
      console.error('Enrich and embed error:', error);

      // Mark block as failed
      await supabaseAdmin
        .from('memory_blocks')
        .update({ status: 'failed' })
        .eq('id', blockId);

      throw error;
    }
  }

  private async enrichBlock(block: MemoryBlock | any): Promise<MemoryBlock> {
    try {
      const prompt = ENRICHMENT_PROMPT
        .replace('{content}', block.content_text)
        .replace('{source_feature}', block.source_feature)
        .replace('{block_type}', block.block_type);

      const response = await this.openaiService.generateStructuredResponse(
        prompt,
        'You are a metadata extraction system for Luma.',
        []
      );

      // Parse JSON response
      const metadata = this.parseJSON(response.content);

      return {
        ...block,
        summary: metadata.summary,
        sentiment: metadata.sentiment,
        emotional_tone: metadata.emotional_tone,
        themes: metadata.themes,
        tags: metadata.tags,
        crisis_flag: metadata.crisis_flag,
        sensitivity_flag: metadata.sensitivity_flag,
        relevance_score: metadata.relevance_score,
      };
    } catch (error) {
      console.error('Enrichment error:', error);
      // Return block as-is if enrichment fails
      return block;
    }
  }

  // =====================================================
  // 3. RETRIEVAL - Semantic search and context synthesis
  // =====================================================

  async retrieveContext(userId: string, context: RetrievalContext): Promise<any> {
    // Check if memory system is enabled
    if (!MemoryConfig.isSystemEnabled()) {
      return this.getEmptyContext();
    }

    // Check if memory is enabled for this user
    const memoryEnabled = await this.isMemoryEnabled(userId, context.targetFeature);
    if (!memoryEnabled) {
      return this.getEmptyContext();
    }

    // Generate cache key
    const cacheKey = this.generateContextCacheKey(userId, context);

    try {
      // Try to get from cache first
      const cachedContext = await cacheService.get<any>(cacheKey);
      if (cachedContext) {
        console.log(`✅ Cache hit for context: ${cacheKey}`);
        return cachedContext;
      }

      console.log(`⚠️ Cache miss for context: ${cacheKey}`);

      // Create LangFuse trace (optional)
      const trace = MemoryConfig.isLangfuseEnabled()
        ? await this.langfuseService.createTrace(
            'memory_retrieve',
            userId,
            { target_feature: context.targetFeature, query: context.query }
          ).catch(() => null)
        : null;

      // Generate embedding for query
      const queryEmbedding = await this.openaiService.generateEmbedding(
        context.query || context.currentTopic || 'general context'
      );

      // Search for similar blocks using pgvector
      const { data: similarBlocks, error } = await supabaseAdmin.rpc('search_memory_blocks', {
        p_user_id: userId,
        p_query_embedding: JSON.stringify(queryEmbedding),
        p_limit: context.limit || MemoryConfig.getMaxContextBlocks(),
        p_similarity_threshold: context.similarityThreshold || MemoryConfig.getSimilarityThreshold(),
        p_exclude_crisis: context.excludeCrisis !== false,
      });

      if (error) {
        if (MemoryConfig.isFailFastEnabled()) {
          throw error;
        }
        console.error('Retrieval error:', error);
        return this.getEmptyContext();
      }

      // Log retrievals (non-blocking)
      if (similarBlocks && similarBlocks.length > 0) {
        this.logRetrievals(userId, similarBlocks, context.targetFeature)
          .catch((err) => console.error('Retrieval logging error:', err));
      }

      // Synthesize context from retrieved blocks
      const synthesizedContext = MemoryConfig.isSynthesisEnabled()
        ? await this.synthesizeContext(similarBlocks || [], context)
        : this.getEmptyContext();

      // Cache the result
      await cacheService.set(cacheKey, synthesizedContext, MemoryConfig.getCacheTTL());

      // Update trace
      if (trace && typeof trace.update === 'function') {
        trace.update({
          output: {
            blocks_retrieved: similarBlocks?.length || 0,
            context: synthesizedContext,
          },
        }).catch(() => {});
      }

      return synthesizedContext;
    } catch (error) {
      console.error('Retrieval error:', error);
      if (MemoryConfig.isFailFastEnabled()) {
        throw error;
      }
      return this.getEmptyContext(); // Graceful fallback
    }
  }

  /**
   * Log multiple retrievals (non-blocking)
   */
  private async logRetrievals(
    userId: string,
    blocks: any[],
    targetFeature: string
  ): Promise<void> {
    const logPromises = blocks.map((block) =>
      this.logOperation('retrieve', userId, block.block_id, targetFeature, {
        similarity: block.similarity,
        reason: 'semantic_search',
      }, block.similarity)
    );

    const updatePromises = blocks.map((block) =>
      supabaseAdmin
        .from('memory_blocks')
        .update({
          retrieval_count: supabaseAdmin.sql`retrieval_count + 1`,
          last_retrieved_at: new Date().toISOString(),
        })
        .eq('id', block.block_id)
    );

    await Promise.all([...logPromises, ...updatePromises]);
  }

  /**
   * Generate cache key for context retrieval
   */
  private generateContextCacheKey(userId: string, context: RetrievalContext): string {
    const queryHash = context.query || context.currentTopic || 'general';
    const normalizedQuery = queryHash.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
    return `context:${userId}:${context.targetFeature}:${normalizedQuery}`;
  }

  /**
   * Get empty context (fallback)
   */
  private getEmptyContext(): any {
    return {
      context_bullets: [],
      suggested_tone: 'supportive',
      key_themes: [],
    };
  }

  private async synthesizeContext(blocks: any[], context: RetrievalContext): Promise<any> {
    if (!blocks || blocks.length === 0) {
      return {
        context_bullets: [],
        suggested_tone: 'supportive',
        key_themes: [],
      };
    }

    try {
      const blocksText = blocks
        .map(
          (b, i) =>
            `Block ${i + 1} (${b.block_type}, similarity: ${b.similarity}):\n${b.summary || b.content_text}`
        )
        .join('\n\n');

      const prompt = CONTEXT_SYNTHESIS_PROMPT
        .replace('{memory_blocks}', blocksText)
        .replace('{current_topic}', context.currentTopic || context.query || 'general')
        .replace('{target_feature}', context.targetFeature)
        .replace('{mood}', context.mood || 'not specified');

      const response = await this.openaiService.generateStructuredResponse(
        prompt,
        'You are a context synthesis system for Luma.',
        []
      );

      return this.parseJSON(response.content);
    } catch (error) {
      console.error('Context synthesis error:', error);
      return {
        context_bullets: [],
        suggested_tone: 'supportive',
        key_themes: [],
      };
    }
  }

  // =====================================================
  // 4. RELATIONS - Auto-detect and manage connections
  // =====================================================

  /**
   * Auto-detect relations (async via job queue)
   * EXPENSIVE: Only runs if enabled and user is under rate limit
   */
  private async autoDetectRelations(newBlock: any): Promise<void> {
    // Check if relation detection is enabled
    if (!MemoryConfig.isRelationsEnabled()) {
      return;
    }

    try {
      // Check rate limit
      const { data: canDetect } = await supabaseAdmin.rpc('can_detect_relations', {
        p_user_id: newBlock.user_id,
        p_max_per_hour: MemoryConfig.getRelationRateLimit(),
      });

      if (!canDetect) {
        console.log(`⚠️ Rate limit reached for relation detection: user ${newBlock.user_id}`);
        return;
      }

      // Increment rate limit counter
      await supabaseAdmin.rpc('increment_relation_detection', {
        p_user_id: newBlock.user_id,
      });

      // Enqueue relation detection job (async)
      await jobQueueService.enqueue('detect_relations', newBlock.user_id, {
        block_id: newBlock.id,
      }, 1); // Lower priority than enrichment

      console.log(`✅ Enqueued relation detection for block ${newBlock.id}`);
    } catch (error) {
      console.error('Auto-detect relations error:', error);
      // Don't throw - graceful fallback
    }
  }

  /**
   * Detect relations synchronously (for worker processing)
   * This is called by the worker, not by the API
   */
  async detectRelationsForBlock(blockId: string): Promise<void> {
    try {
      // Get the block
      const { data: newBlock, error: blockError } = await supabaseAdmin
        .from('memory_blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (blockError || !newBlock) {
        throw new Error(`Block not found: ${blockId}`);
      }

      // Get recent blocks from the same user (last 20)
      const { data: recentBlocks, error } = await supabaseAdmin
        .from('memory_blocks')
        .select('id, content_text, summary, block_type, source_feature')
        .eq('user_id', newBlock.user_id)
        .eq('status', 'active') // Only consider enriched blocks
        .neq('id', newBlock.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !recentBlocks || recentBlocks.length === 0) {
        console.log(`No recent blocks found for relation detection: ${blockId}`);
        return;
      }

      // Check for relations with recent blocks
      let relationsCreated = 0;
      for (const block of recentBlocks) {
        const relation = await this.detectRelation(newBlock, block);
        if (relation && relation.is_related) {
          await this.createRelation({
            source_block_id: newBlock.id,
            target_block_id: block.id,
            relation_type: relation.relation_type,
            strength: relation.strength,
          }, newBlock.user_id);
          relationsCreated++;
        }
      }

      console.log(`✅ Detected ${relationsCreated} relations for block ${blockId}`);
    } catch (error) {
      console.error('Detect relations error:', error);
      throw error;
    }
  }

  private async detectRelation(blockA: any, blockB: any): Promise<any> {
    try {
      const prompt = RELATION_DETECTION_PROMPT
        .replace('{block_a_content}', blockA.summary || blockA.content_text)
        .replace('{block_a_type}', blockA.block_type)
        .replace('{block_a_source}', blockA.source_feature)
        .replace('{block_b_content}', blockB.summary || blockB.content_text)
        .replace('{block_b_type}', blockB.block_type)
        .replace('{block_b_source}', blockB.source_feature);

      const response = await this.openaiService.generateStructuredResponse(
        prompt,
        'You are a relation detection system for Luma.',
        []
      );

      return this.parseJSON(response.content);
    } catch (error) {
      console.error('Relation detection error:', error);
      return { is_related: false };
    }
  }

  async createRelation(relation: MemoryRelation, userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('memory_relations')
      .insert({
        user_id: userId,
        source_block_id: relation.source_block_id,
        target_block_id: relation.target_block_id,
        relation_type: relation.relation_type,
        strength: relation.strength || 0.5,
        auto_generated: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create relation error:', error);
      return null;
    }

    return data;
  }

  // =====================================================
  // 5. INSIGHTS - Generate weekly summaries
  // =====================================================

  /**
   * Generate weekly summary (for worker processing)
   * This is called by the worker or cron job
   */
  async generateWeeklySummary(userId: string): Promise<any> {
    // Check if weekly summaries are enabled
    if (!MemoryConfig.isWeeklySummariesEnabled()) {
      return null;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      // Get blocks from last week (only active blocks)
      const { data: weeklyBlocks } = await supabaseAdmin
        .from('memory_blocks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      // Get mood data
      const { data: moodData } = await supabaseAdmin
        .from('mood_checkins')
        .select('mood_value, notes, created_at')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!weeklyBlocks || weeklyBlocks.length === 0) {
        console.log(`No blocks found for weekly summary: user ${userId}`);
        return null;
      }

      const blocksText = weeklyBlocks
        .map((b) => `${b.block_type}: ${b.summary || b.content_text}`)
        .join('\n');

      const moodText = moodData
        ?.map((m) => `${m.mood_value}/6${m.notes ? ` - ${m.notes}` : ''}`)
        .join('\n') || 'No mood data';

      const prompt = WEEKLY_SUMMARY_PROMPT
        .replace('{weekly_blocks}', blocksText)
        .replace('{mood_data}', moodText);

      const response = await this.openaiService.generateStructuredResponse(
        prompt,
        'You are a weekly summary generator for Luma.',
        []
      );

      const summaryData = this.parseJSON(response.content);

      // Save insight to database
      const { data: insight, error } = await supabaseAdmin
        .from('memory_insights')
        .insert({
          user_id: userId,
          insight_type: 'weekly_summary',
          title: summaryData.title,
          summary: summaryData.summary,
          detailed_analysis: JSON.stringify(summaryData),
          insights_data: summaryData,
          source_blocks: weeklyBlocks.map((b) => b.id),
          period_start: oneWeekAgo.toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Generated weekly summary for user ${userId}`);
      return insight;
    } catch (error) {
      console.error('Weekly summary generation error:', error);
      if (MemoryConfig.isFailFastEnabled()) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Enqueue weekly summary job (call from cron)
   */
  async enqueueWeeklySummary(userId: string): Promise<string | null> {
    try {
      const jobId = await jobQueueService.enqueue('weekly_summary', userId, {}, 2); // Lowest priority
      console.log(`✅ Enqueued weekly summary job for user ${userId}`);
      return jobId;
    } catch (error) {
      console.error('Failed to enqueue weekly summary:', error);
      return null;
    }
  }

  // =====================================================
  // 6. USER CONTROLS - Privacy and settings
  // =====================================================

  async isMemoryEnabled(userId: string, feature?: string): Promise<boolean> {
    const { data: settings } = await supabaseAdmin
      .from('user_memory_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings || !settings.memory_enabled) {
      return false;
    }

    if (feature) {
      const featureKey = `${feature}_memory_enabled`;
      return settings[featureKey] !== false;
    }

    return true;
  }

  async getMemorySettings(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_memory_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Create default settings if not found
      if (error.code === 'PGRST116') {
        return this.createDefaultSettings(userId);
      }
      throw error;
    }

    return data;
  }

  async updateMemorySettings(userId: string, settings: any): Promise<any> {
    const { data, error } = await supabase
      .from('user_memory_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async createDefaultSettings(userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('user_memory_settings')
      .insert({
        user_id: userId,
        memory_enabled: true,
        chat_memory_enabled: true,
        journal_memory_enabled: true,
        goals_memory_enabled: true,
        tools_memory_enabled: true,
        default_privacy_level: 'ai-only',
        allow_crisis_recall: false,
        allow_cross_feature_recall: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async getDefaultPrivacyLevel(userId: string): Promise<string> {
    const settings = await this.getMemorySettings(userId);
    return settings?.default_privacy_level || 'ai-only';
  }

  async excludeBlock(blockId: string, userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('memory_blocks')
      .update({ exclude_from_memory: true })
      .eq('id', blockId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    await this.logOperation('exclude', userId, blockId, 'user_action', {
      reason: 'User excluded block from memory',
    });

    return data;
  }

  async deleteBlock(blockId: string, userId: string): Promise<void> {
    await this.logOperation('delete', userId, blockId, 'user_action', {
      reason: 'User deleted block',
    });

    const { error } = await supabase
      .from('memory_blocks')
      .delete()
      .eq('id', blockId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // =====================================================
  // 7. MEMORY LEDGER - Track operations
  // =====================================================

  private async logOperation(
    operationType: string,
    userId: string,
    blockId: string | null,
    triggeredBy: string,
    context?: any,
    relevanceScore?: number
  ): Promise<void> {
    await supabaseAdmin
      .from('memory_ledger')
      .insert({
        user_id: userId,
        operation_type: operationType,
        block_id: blockId,
        triggered_by: triggeredBy,
        context: context || {},
        relevance_score: relevanceScore,
      });
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private parseJSON(content: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('JSON parse error:', error);
      return {};
    }
  }
}

export const memoryService = new MemoryService();
