import { supabase, supabaseAdmin } from '../../config/supabase.config';
import { OpenAIService } from '../openai/openai.service';
import { LangFuseService } from '../langfuse/langfuse.service';
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

  async ingestBlock(block: MemoryBlock): Promise<any> {
    // Check if memory is enabled for this user
    const memoryEnabled = await this.isMemoryEnabled(block.user_id, block.source_feature);
    if (!memoryEnabled) {
      return null;
    }

    // Create LangFuse trace (optional - won't break if it fails)
    const trace = await this.langfuseService.createTrace(
      'memory_ingest',
      block.user_id,
      { block_type: block.block_type, source_feature: block.source_feature }
    ).catch(() => null);

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

  private async enrichBlock(block: MemoryBlock): Promise<MemoryBlock> {
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
    // Check if memory is enabled
    const memoryEnabled = await this.isMemoryEnabled(userId, context.targetFeature);
    if (!memoryEnabled) {
      return {
        context_bullets: [],
        suggested_tone: 'supportive',
        key_themes: [],
      };
    }

    // Create LangFuse trace
    const trace = this.langfuseService.createTrace(
      'memory_retrieve',
      userId,
      { target_feature: context.targetFeature, query: context.query }
    );

    try {
      // Generate embedding for query
      const queryEmbedding = await this.openaiService.generateEmbedding(
        context.query || context.currentTopic || 'general context'
      );

      // Search for similar blocks using pgvector
      const { data: similarBlocks, error } = await supabaseAdmin.rpc('search_memory_blocks', {
        p_user_id: userId,
        p_query_embedding: JSON.stringify(queryEmbedding),
        p_limit: context.limit || 10,
        p_similarity_threshold: context.similarityThreshold || 0.70,
        p_exclude_crisis: context.excludeCrisis !== false,
      });

      if (error) throw error;

      // Log retrievals
      for (const block of similarBlocks || []) {
        await this.logOperation('retrieve', userId, block.block_id, context.targetFeature, {
          similarity: block.similarity,
          reason: 'semantic_search',
        }, block.similarity);

        // Update retrieval count
        await supabaseAdmin
          .from('memory_blocks')
          .update({
            retrieval_count: supabaseAdmin.sql`retrieval_count + 1`,
            last_retrieved_at: new Date().toISOString(),
          })
          .eq('id', block.block_id);
      }

      // Synthesize context from retrieved blocks
      const synthesizedContext = await this.synthesizeContext(
        similarBlocks || [],
        context
      );

      await trace.update({
        output: {
          blocks_retrieved: similarBlocks?.length || 0,
          context: synthesizedContext,
        },
      });

      return synthesizedContext;
    } catch (error) {
      console.error('Retrieval error:', error);
      await trace.update({ output: { error: String(error) }, level: 'ERROR' });
      return {
        context_bullets: [],
        suggested_tone: 'supportive',
        key_themes: [],
      };
    }
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

  private async autoDetectRelations(newBlock: any): Promise<void> {
    try {
      // Get recent blocks from the same user (last 20)
      const { data: recentBlocks, error } = await supabaseAdmin
        .from('memory_blocks')
        .select('id, content_text, summary, block_type, source_feature')
        .eq('user_id', newBlock.user_id)
        .neq('id', newBlock.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !recentBlocks) return;

      // Check for relations with recent blocks
      for (const block of recentBlocks) {
        const relation = await this.detectRelation(newBlock, block);
        if (relation && relation.is_related) {
          await this.createRelation({
            source_block_id: newBlock.id,
            target_block_id: block.id,
            relation_type: relation.relation_type,
            strength: relation.strength,
          }, newBlock.user_id);
        }
      }
    } catch (error) {
      console.error('Auto-detect relations error:', error);
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

  async generateWeeklySummary(userId: string): Promise<any> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get blocks from last week
    const { data: weeklyBlocks } = await supabaseAdmin
      .from('memory_blocks')
      .select('*')
      .eq('user_id', userId)
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
      return null;
    }

    try {
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

      return insight;
    } catch (error) {
      console.error('Weekly summary generation error:', error);
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
