import { Router } from 'express';
import { validate } from '../../middleware/validation.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  updateMemorySettingsSchema,
  retrieveContextSchema,
  updateBlockPrivacySchema,
  searchMemorySchema,
} from './memory.schema';
import {
  // Settings
  getMemorySettings,
  updateMemorySettings,
  // Retrieval
  retrieveContext,
  // Blocks
  getMemoryBlocks,
  getMemoryBlock,
  updateBlockPrivacy,
  excludeBlock,
  deleteBlock,
  // Search
  searchMemory,
  // Insights
  getMemoryInsights,
  generateWeeklySummary,
  // Ledger
  getMemoryLedger,
  // Explainability
  explainBlock,
} from './memory.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =====================================================
// 1. MEMORY SETTINGS ROUTES
// =====================================================

// GET /api/memory/settings - Get user memory settings
router.get('/settings', getMemorySettings);

// PATCH /api/memory/settings - Update memory settings
router.patch('/settings', validate(updateMemorySettingsSchema), updateMemorySettings);

// =====================================================
// 2. MEMORY RETRIEVAL ROUTES (for features)
// =====================================================

// POST /api/memory/retrieve - Retrieve context for a feature
router.post('/retrieve', validate(retrieveContextSchema), retrieveContext);

// =====================================================
// 3. MEMORY BLOCKS ROUTES
// =====================================================

// GET /api/memory/blocks - Get all memory blocks (with filters)
router.get('/blocks', getMemoryBlocks);

// GET /api/memory/blocks/:blockId - Get single block with relations
router.get('/blocks/:blockId', getMemoryBlock);

// PATCH /api/memory/blocks/:blockId/privacy - Update block privacy level
router.patch(
  '/blocks/:blockId/privacy',
  validate(updateBlockPrivacySchema),
  updateBlockPrivacy
);

// PATCH /api/memory/blocks/:blockId/exclude - Exclude block from memory
router.patch('/blocks/:blockId/exclude', excludeBlock);

// DELETE /api/memory/blocks/:blockId - Delete block permanently
router.delete('/blocks/:blockId', deleteBlock);

// =====================================================
// 4. MEMORY SEARCH ROUTES
// =====================================================

// POST /api/memory/search - Search memory with semantic similarity
router.post('/search', validate(searchMemorySchema), searchMemory);

// =====================================================
// 5. MEMORY INSIGHTS ROUTES
// =====================================================

// GET /api/memory/insights - Get memory insights (weekly summaries, patterns)
router.get('/insights', getMemoryInsights);

// POST /api/memory/insights/weekly - Generate weekly summary
router.post('/insights/weekly', generateWeeklySummary);

// =====================================================
// 6. MEMORY LEDGER ROUTES
// =====================================================

// GET /api/memory/ledger - Get memory operation history
router.get('/ledger', getMemoryLedger);

// =====================================================
// 7. EXPLAINABILITY ROUTES
// =====================================================

// GET /api/memory/blocks/:blockId/explain - Explain why block was remembered/retrieved
router.get('/blocks/:blockId/explain', explainBlock);

export default router;
