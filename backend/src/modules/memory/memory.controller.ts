import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { memoryService } from '../../services/memory/memory.service';
import {
  UpdateMemorySettingsInput,
  RetrieveContextInput,
  UpdateBlockPrivacyInput,
  SearchMemoryInput,
} from './memory.schema';
import { supabase } from '../../config/supabase.config';

// =====================================================
// 1. MEMORY SETTINGS - User controls
// =====================================================

export const getMemorySettings = async (req: Request, res: Response) => {
  try {
    const settings = await memoryService.getMemorySettings(req.userId!);

    sendSuccess(res, { settings }, 'Memory settings retrieved successfully');
  } catch (error) {
    console.error('Get memory settings error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get memory settings', 500);
  }
};

export const updateMemorySettings = async (req: Request, res: Response) => {
  try {
    const input = req.body as UpdateMemorySettingsInput;

    const settings = await memoryService.updateMemorySettings(req.userId!, input);

    sendSuccess(res, { settings }, 'Memory settings updated successfully');
  } catch (error) {
    console.error('Update memory settings error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to update memory settings', 500);
  }
};

// =====================================================
// 2. MEMORY RETRIEVAL - Context for features
// =====================================================

export const retrieveContext = async (req: Request, res: Response) => {
  try {
    const input = req.body as RetrieveContextInput;

    const context = await memoryService.retrieveContext(req.userId!, {
      query: input.query,
      targetFeature: input.target_feature,
      currentTopic: input.current_topic,
      limit: input.limit,
      similarityThreshold: input.similarity_threshold,
      excludeCrisis: input.exclude_crisis,
    });

    sendSuccess(res, { context }, 'Memory context retrieved successfully');
  } catch (error) {
    console.error('Retrieve context error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to retrieve context', 500);
  }
};

// =====================================================
// 3. MEMORY BLOCKS - View and manage
// =====================================================

export const getMemoryBlocks = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const blockType = req.query.block_type as string | undefined;
    const sourceFeature = req.query.source_feature as string | undefined;

    let query = supabase
      .from('memory_blocks')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('exclude_from_memory', false);

    if (blockType) {
      query = query.eq('block_type', blockType);
    }

    if (sourceFeature) {
      query = query.eq('source_feature', sourceFeature);
    }

    const { data: blocks, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    sendSuccess(res, { blocks, count: blocks.length }, 'Memory blocks retrieved successfully');
  } catch (error) {
    console.error('Get memory blocks error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get memory blocks', 500);
  }
};

export const getMemoryBlock = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    const { data: block, error } = await supabase
      .from('memory_blocks')
      .select('*')
      .eq('id', blockId)
      .eq('user_id', req.userId!)
      .single();

    if (error) throw error;

    // Get related blocks
    const { data: relations, error: relError } = await supabase
      .from('memory_relations')
      .select(`
        *,
        target_block:target_block_id (
          id,
          content_text,
          summary,
          block_type,
          source_feature,
          created_at
        )
      `)
      .eq('source_block_id', blockId)
      .eq('user_id', req.userId!);

    if (relError) throw relError;

    sendSuccess(
      res,
      { block, relations: relations || [] },
      'Memory block retrieved successfully'
    );
  } catch (error) {
    console.error('Get memory block error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get memory block', 500);
  }
};

export const updateBlockPrivacy = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;
    const input = req.body as UpdateBlockPrivacyInput;

    const { data: block, error } = await supabase
      .from('memory_blocks')
      .update({ privacy_level: input.privacy_level })
      .eq('id', blockId)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, { block }, 'Block privacy updated successfully');
  } catch (error) {
    console.error('Update block privacy error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to update block privacy', 500);
  }
};

export const excludeBlock = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    const block = await memoryService.excludeBlock(blockId, req.userId!);

    sendSuccess(res, { block }, 'Block excluded from memory successfully');
  } catch (error) {
    console.error('Exclude block error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to exclude block', 500);
  }
};

export const deleteBlock = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    await memoryService.deleteBlock(blockId, req.userId!);

    sendSuccess(res, null, 'Block deleted successfully');
  } catch (error) {
    console.error('Delete block error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete block', 500);
  }
};

// =====================================================
// 4. MEMORY SEARCH - User-facing search
// =====================================================

export const searchMemory = async (req: Request, res: Response) => {
  try {
    const input = req.body as SearchMemoryInput;

    // Use the memory service to perform semantic search
    const results = await memoryService.retrieveContext(req.userId!, {
      query: input.query,
      targetFeature: 'chat', // Default feature for search
      limit: input.limit,
      similarityThreshold: input.similarity_threshold,
      excludeCrisis: true,
    });

    sendSuccess(res, { results }, 'Memory search completed successfully');
  } catch (error) {
    console.error('Search memory error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to search memory', 500);
  }
};

// =====================================================
// 5. MEMORY INSIGHTS - Weekly summaries and patterns
// =====================================================

export const getMemoryInsights = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const insightType = req.query.insight_type as string | undefined;

    let query = supabase
      .from('memory_insights')
      .select('*')
      .eq('user_id', req.userId!);

    if (insightType) {
      query = query.eq('insight_type', insightType);
    }

    const { data: insights, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    sendSuccess(res, { insights, count: insights.length }, 'Memory insights retrieved successfully');
  } catch (error) {
    console.error('Get memory insights error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get memory insights', 500);
  }
};

export const generateWeeklySummary = async (req: Request, res: Response) => {
  try {
    const insight = await memoryService.generateWeeklySummary(req.userId!);

    if (!insight) {
      sendSuccess(res, { insight: null }, 'No activity this week to summarize');
      return;
    }

    sendSuccess(res, { insight }, 'Weekly summary generated successfully', 201);
  } catch (error) {
    console.error('Generate weekly summary error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to generate weekly summary', 500);
  }
};

// =====================================================
// 6. MEMORY LEDGER - View operation history
// =====================================================

export const getMemoryLedger = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const operationType = req.query.operation_type as string | undefined;

    let query = supabase
      .from('memory_ledger')
      .select('*')
      .eq('user_id', req.userId!);

    if (operationType) {
      query = query.eq('operation_type', operationType);
    }

    const { data: ledger, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    sendSuccess(
      res,
      { ledger, count: ledger.length },
      'Memory ledger retrieved successfully'
    );
  } catch (error) {
    console.error('Get memory ledger error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get memory ledger', 500);
  }
};

// =====================================================
// 7. EXPLAINABILITY - Why was this remembered/retrieved?
// =====================================================

export const explainBlock = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    // Get the block
    const { data: block, error: blockError } = await supabase
      .from('memory_blocks')
      .select('*')
      .eq('id', blockId)
      .eq('user_id', req.userId!)
      .single();

    if (blockError) throw blockError;

    // Get creation context from ledger
    const { data: creationLog, error: logError } = await supabase
      .from('memory_ledger')
      .select('*')
      .eq('block_id', blockId)
      .eq('operation_type', 'create')
      .single();

    if (logError && logError.code !== 'PGRST116') throw logError;

    // Get retrieval history
    const { data: retrievalLogs, error: retrievalError } = await supabase
      .from('memory_ledger')
      .select('*')
      .eq('block_id', blockId)
      .eq('operation_type', 'retrieve')
      .order('created_at', { ascending: false })
      .limit(10);

    if (retrievalError) throw retrievalError;

    const explanation = {
      why_remembered: {
        source: block.source_feature,
        block_type: block.block_type,
        relevance_score: block.relevance_score,
        themes: block.themes,
        created_at: block.created_at,
        reason: `This ${block.block_type} was saved from your ${block.source_feature} activity. It was identified as having a relevance score of ${block.relevance_score}, indicating it may be useful for future context.`,
      },
      why_retrieved: {
        retrieval_count: block.retrieval_count,
        last_retrieved_at: block.last_retrieved_at,
        recent_retrievals: retrievalLogs?.map((log) => ({
          triggered_by: log.triggered_by,
          relevance_score: log.relevance_score,
          created_at: log.created_at,
          reason: log.reason,
        })),
        explanation: block.retrieval_count > 0
          ? `This memory has been retrieved ${block.retrieval_count} time(s) to provide context in your ${retrievalLogs?.[0]?.triggered_by || 'various'} interactions.`
          : 'This memory has not been retrieved yet, but is available for future context.',
      },
    };

    sendSuccess(res, { explanation }, 'Block explanation generated successfully');
  } catch (error) {
    console.error('Explain block error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to explain block', 500);
  }
};
