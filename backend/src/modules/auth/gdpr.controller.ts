/**
 * GDPR Compliance Controller
 *
 * Handles GDPR-related functionality:
 * - Data export (Right to data portability)
 * - Account deletion (Right to be forgotten)
 * - Data access requests
 */

import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { supabaseAdmin } from '../../config/supabase.config';
import { securityLogger, SecurityEventType, SecuritySeverity } from '../../utils/security-logger';

/**
 * Export all user data (GDPR Article 20 - Right to data portability)
 * GET /api/v1/auth/gdpr/export
 */
export const exportUserData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Log data export request
    securityLogger.log({
      type: SecurityEventType.DATA_EXPORT_REQUEST,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ip: req.ip,
      message: `User ${userId} requested data export`,
    });

    console.log(`[GDPR] Exporting data for user ${userId}...`);

    // Fetch all user data from all tables
    const [
      userProfile,
      conversations,
      messages,
      journalSessions,
      journalEntries,
      goals,
      actionPlans,
      brainExercises,
      narratives,
      futureMeExercises,
      memoryBlocks,
      events,
      nudges,
      feedback,
    ] = await Promise.all([
      // User profile
      supabaseAdmin.from('users').select('*').eq('id', userId).single(),

      // Chat data
      supabaseAdmin.from('conversations').select('*').eq('user_id', userId),
      supabaseAdmin
        .from('messages')
        .select('*, conversation:conversations!inner(user_id)')
        .eq('conversation.user_id', userId),

      // Journal data
      supabaseAdmin.from('journal_sessions').select('*').eq('user_id', userId),
      supabaseAdmin
        .from('journal_entries')
        .select('*, session:journal_sessions!inner(user_id)')
        .eq('session.user_id', userId),

      // Goals data
      supabaseAdmin.from('goals').select('*').eq('user_id', userId),
      supabaseAdmin
        .from('action_plans')
        .select('*, goal:goals!inner(user_id)')
        .eq('goal.user_id', userId),

      // Tools data
      supabaseAdmin.from('brain_exercises').select('*').eq('user_id', userId),
      supabaseAdmin.from('narratives').select('*').eq('user_id', userId),
      supabaseAdmin.from('future_me_exercises').select('*').eq('user_id', userId),

      // Memory data
      supabaseAdmin.from('memory_blocks').select('*').eq('user_id', userId),

      // Master Agent data
      supabaseAdmin.from('events').select('*').eq('user_id', userId),
      supabaseAdmin.from('nudges').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_feedback').select('*').eq('user_id', userId),
    ]);

    // Compile comprehensive user data export
    const exportData = {
      exportDate: new Date().toISOString(),
      user: userProfile.data,
      statistics: {
        totalConversations: conversations.data?.length || 0,
        totalMessages: messages.data?.length || 0,
        totalJournalSessions: journalSessions.data?.length || 0,
        totalJournalEntries: journalEntries.data?.length || 0,
        totalGoals: goals.data?.length || 0,
        totalBrainExercises: brainExercises.data?.length || 0,
        totalNarratives: narratives.data?.length || 0,
        totalFutureMeExercises: futureMeExercises.data?.length || 0,
        totalMemoryBlocks: memoryBlocks.data?.length || 0,
        totalEvents: events.data?.length || 0,
        totalNudges: nudges.data?.length || 0,
        totalFeedback: feedback.data?.length || 0,
      },
      data: {
        profile: userProfile.data,
        chat: {
          conversations: conversations.data || [],
          messages: messages.data || [],
        },
        journal: {
          sessions: journalSessions.data || [],
          entries: journalEntries.data || [],
        },
        goals: {
          goals: goals.data || [],
          actionPlans: actionPlans.data || [],
        },
        tools: {
          brainExercises: brainExercises.data || [],
          narratives: narratives.data || [],
          futureMeExercises: futureMeExercises.data || [],
        },
        memory: {
          blocks: memoryBlocks.data || [],
        },
        masterAgent: {
          events: events.data || [],
          nudges: nudges.data || [],
          feedback: feedback.data || [],
        },
      },
      metadata: {
        exportFormat: 'JSON',
        gdprCompliant: true,
        rightToDataPortability: 'GDPR Article 20',
        applicationName: 'Luma Mental Wellness',
        applicationVersion: '1.0.0',
      },
    };

    console.log(`[GDPR] Data export completed for user ${userId}`);

    sendSuccess(res, exportData, 'Data export successful');
  } catch (error) {
    console.error('[GDPR] Export error:', error);
    sendError(res, error instanceof Error ? error.message : 'Data export failed', 500);
  }
};

/**
 * Delete user account and all associated data (GDPR Article 17 - Right to be forgotten)
 * DELETE /api/v1/auth/gdpr/delete-account
 */
export const deleteUserAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const confirmationText = req.body.confirmation;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Require explicit confirmation
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return sendError(res, 'Confirmation text does not match. Please type "DELETE MY ACCOUNT"', 400);
    }

    // Log account deletion request
    securityLogger.log({
      type: SecurityEventType.DATA_DELETION_REQUEST,
      severity: SecuritySeverity.HIGH,
      userId,
      ip: req.ip,
      message: `User ${userId} requested account deletion`,
    });

    console.log(`[GDPR] Deleting account for user ${userId}...`);

    // Delete all user data in correct order (respecting foreign key constraints)
    // Note: With proper CASCADE settings in the database, most of these would auto-delete,
    // but we're being explicit for audit trail purposes

    await Promise.all([
      // Delete chat data
      supabaseAdmin.from('messages')
        .delete()
        .in('conversation_id',
          supabaseAdmin.from('conversations').select('id').eq('user_id', userId)
        ),

      // Delete journal data
      supabaseAdmin.from('journal_entries')
        .delete()
        .in('session_id',
          supabaseAdmin.from('journal_sessions').select('id').eq('user_id', userId)
        ),

      // Delete goals data
      supabaseAdmin.from('action_steps')
        .delete()
        .in('plan_id',
          supabaseAdmin.from('action_plans').select('id')
            .in('goal_id',
              supabaseAdmin.from('goals').select('id').eq('user_id', userId)
            )
        ),
      supabaseAdmin.from('action_plans')
        .delete()
        .in('goal_id',
          supabaseAdmin.from('goals').select('id').eq('user_id', userId)
        ),

      // Delete tools data
      supabaseAdmin.from('brain_exercises').delete().eq('user_id', userId),
      supabaseAdmin.from('narratives').delete().eq('user_id', userId),
      supabaseAdmin.from('future_me_exercises').delete().eq('user_id', userId),

      // Delete memory data
      supabaseAdmin.from('memory_blocks').delete().eq('user_id', userId),

      // Delete master agent data
      supabaseAdmin.from('events').delete().eq('user_id', userId),
      supabaseAdmin.from('nudges').delete().eq('user_id', userId),
      supabaseAdmin.from('user_feedback').delete().eq('user_id', userId),
    ]);

    // Delete top-level tables
    await Promise.all([
      supabaseAdmin.from('conversations').delete().eq('user_id', userId),
      supabaseAdmin.from('journal_sessions').delete().eq('user_id', userId),
      supabaseAdmin.from('goals').delete().eq('user_id', userId),
    ]);

    // Finally, delete the user account from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    console.log(`[GDPR] Account deletion completed for user ${userId}`);

    sendSuccess(res, null, 'Account and all associated data have been permanently deleted');
  } catch (error) {
    console.error('[GDPR] Delete account error:', error);
    sendError(res, error instanceof Error ? error.message : 'Account deletion failed', 500);
  }
};

/**
 * Get data access summary (GDPR Article 15 - Right of access)
 * GET /api/v1/auth/gdpr/data-summary
 */
export const getDataSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Get counts of all user data
    const [
      conversationsCount,
      messagesCount,
      journalSessionsCount,
      journalEntriesCount,
      goalsCount,
      brainExercisesCount,
      narrativesCount,
      futureMeCount,
      memoryBlocksCount,
      eventsCount,
      nudgesCount,
    ] = await Promise.all([
      supabaseAdmin.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id',
          supabaseAdmin.from('conversations').select('id').eq('user_id', userId)
        ),
      supabaseAdmin.from('journal_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .in('session_id',
          supabaseAdmin.from('journal_sessions').select('id').eq('user_id', userId)
        ),
      supabaseAdmin.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('brain_exercises').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('narratives').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('future_me_exercises').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('memory_blocks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('nudges').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const summary = {
      userId,
      dataSummary: {
        conversations: conversationsCount.count || 0,
        messages: messagesCount.count || 0,
        journalSessions: journalSessionsCount.count || 0,
        journalEntries: journalEntriesCount.count || 0,
        goals: goalsCount.count || 0,
        brainExercises: brainExercisesCount.count || 0,
        narratives: narrativesCount.count || 0,
        futureMeExercises: futureMeCount.count || 0,
        memoryBlocks: memoryBlocksCount.count || 0,
        events: eventsCount.count || 0,
        nudges: nudgesCount.count || 0,
      },
      gdprRights: {
        rightOfAccess: 'You can request a summary of your personal data (GDPR Article 15)',
        rightToDataPortability: 'You can export all your data in JSON format (GDPR Article 20)',
        rightToErasure: 'You can request deletion of your account and all data (GDPR Article 17)',
        rightToRectification: 'You can update your profile information at any time (GDPR Article 16)',
      },
    };

    sendSuccess(res, summary, 'Data summary retrieved successfully');
  } catch (error) {
    console.error('[GDPR] Data summary error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get data summary', 500);
  }
};
