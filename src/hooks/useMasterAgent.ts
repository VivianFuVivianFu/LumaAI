import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Types
export interface MasterAgentEvent {
  event_type: string;
  feature_area: 'dashboard' | 'goals' | 'journal' | 'chat' | 'tools';
  event_data?: Record<string, any>;
}

export interface Nudge {
  id: string;
  surface: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  cta_label?: string;
  cta_route?: string;
  rule_name: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'dismissed';
}

export interface Feedback {
  feature_area: string;
  feedback_type: 'bug' | 'suggestion' | 'praise' | 'other';
  rating?: number;
  comments?: string;
}

export interface ContextSnapshot {
  last_active: string;
  activity_streak: number;
  features_used: string[];
  goals_count: number;
  journal_entries_count: number;
  chat_messages_count: number;
  mood_trends: Record<string, number>;
}

/**
 * Master Agent Hook
 *
 * Provides Phase 3 functionality:
 * - Event logging (fire-and-forget)
 * - Nudge fetching and management
 * - Feedback submission
 * - Context retrieval
 */
export function useMasterAgent() {
  const { token } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [context, setContext] = useState<ContextSnapshot | null>(null);
  const [isLoadingNudges, setIsLoadingNudges] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Helper: Make authenticated API calls
  const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  };

  /**
   * Log Event (Fire-and-Forget)
   *
   * Logs user activity to the Master Agent for context building.
   * Does not wait for response - fires and forgets.
   *
   * @param event - Event to log
   */
  const logEvent = useCallback(
    async (event: MasterAgentEvent) => {
      if (!token) return;

      try {
        // Fire-and-forget: Don't await, don't handle errors
        fetch(`${API_BASE_URL}/master-agent/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(event),
        }).catch(() => {
          // Silently fail - event logging shouldn't break user experience
          console.debug('Event logging failed (non-critical)');
        });
      } catch (error) {
        // Silently fail - event logging is non-critical
        console.debug('Event logging error (non-critical):', error);
      }
    },
    [token]
  );

  /**
   * Fetch Nudges for a Surface
   *
   * Retrieves intelligent nudges for a specific app surface.
   *
   * @param surface - The surface to fetch nudges for
   * @returns Array of nudges
   */
  const fetchNudges = useCallback(
    async (surface: string): Promise<Nudge[]> => {
      if (!token) return [];

      try {
        setIsLoadingNudges(true);
        const result = await fetchApi(`/master-agent/nudges/${surface}`);
        return result.nudges || [];
      } catch (error) {
        console.error('Failed to fetch nudges:', error);
        return [];
      } finally {
        setIsLoadingNudges(false);
      }
    },
    [token]
  );

  /**
   * Accept a Nudge
   *
   * Marks a nudge as accepted and optionally navigates to CTA route.
   *
   * @param nudgeId - The nudge ID
   */
  const acceptNudge = useCallback(
    async (nudgeId: string) => {
      if (!token) return;

      try {
        await fetchApi(`/master-agent/nudges/${nudgeId}/accept`, {
          method: 'POST',
        });

        // Update local state
        setNudges((prev) =>
          prev.map((nudge) =>
            nudge.id === nudgeId ? { ...nudge, status: 'accepted' as const } : nudge
          )
        );

        // Log acceptance event
        logEvent({
          event_type: 'nudge_accepted',
          feature_area: 'dashboard',
          event_data: { nudge_id: nudgeId },
        });
      } catch (error) {
        console.error('Failed to accept nudge:', error);
      }
    },
    [token, logEvent]
  );

  /**
   * Dismiss a Nudge
   *
   * Marks a nudge as dismissed.
   *
   * @param nudgeId - The nudge ID
   */
  const dismissNudge = useCallback(
    async (nudgeId: string) => {
      if (!token) return;

      try {
        await fetchApi(`/master-agent/nudges/${nudgeId}/dismiss`, {
          method: 'POST',
        });

        // Update local state
        setNudges((prev) =>
          prev.map((nudge) =>
            nudge.id === nudgeId ? { ...nudge, status: 'dismissed' as const } : nudge
          )
        );

        // Log dismissal event
        logEvent({
          event_type: 'nudge_dismissed',
          feature_area: 'dashboard',
          event_data: { nudge_id: nudgeId },
        });
      } catch (error) {
        console.error('Failed to dismiss nudge:', error);
      }
    },
    [token, logEvent]
  );

  /**
   * Submit Feedback
   *
   * Sends user feedback to the Master Agent.
   *
   * @param feedback - Feedback data
   */
  const submitFeedback = useCallback(
    async (feedback: Feedback) => {
      if (!token) return;

      try {
        await fetchApi('/master-agent/feedback', {
          method: 'POST',
          body: JSON.stringify(feedback),
        });

        // Log feedback event
        logEvent({
          event_type: 'feedback_submitted',
          feature_area: feedback.feature_area as any,
          event_data: {
            type: feedback.feedback_type,
            rating: feedback.rating,
          },
        });

        return true;
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        return false;
      }
    },
    [token, logEvent]
  );

  /**
   * Get Context Snapshot
   *
   * Retrieves the user's current context from the Master Agent.
   */
  const fetchContext = useCallback(async () => {
    if (!token) return null;

    try {
      setIsLoadingContext(true);
      const result = await fetchApi('/master-agent/context');
      setContext(result.context);
      return result.context;
    } catch (error) {
      console.error('Failed to fetch context:', error);
      return null;
    } finally {
      setIsLoadingContext(false);
    }
  }, [token]);

  /**
   * Load Nudges for Multiple Surfaces
   *
   * Helper to load nudges for all surfaces at once.
   */
  const loadAllNudges = useCallback(async () => {
    if (!token) return;

    const surfaces = ['home', 'goals', 'journal', 'chat', 'tools'];
    const allNudges: Nudge[] = [];

    await Promise.all(
      surfaces.map(async (surface) => {
        const surfaceNudges = await fetchNudges(surface);
        allNudges.push(...surfaceNudges);
      })
    );

    setNudges(allNudges);
  }, [token, fetchNudges]);

  // Auto-fetch context on mount (optional)
  useEffect(() => {
    if (token) {
      fetchContext();
    }
  }, [token]); // Only fetch once on mount, not on every token change

  return {
    // Event Logging
    logEvent,

    // Nudges
    nudges,
    isLoadingNudges,
    fetchNudges,
    acceptNudge,
    dismissNudge,
    loadAllNudges,

    // Feedback
    submitFeedback,

    // Context
    context,
    isLoadingContext,
    fetchContext,
  };
}
