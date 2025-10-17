// API Client for Luma Backend

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from localStorage
  const token = localStorage.getItem('luma_auth_token');

  // Set default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error);
  }
}

// Auth API
export const authApi = {
  async register(data: { email: string; password: string; name: string }) {
    const result = await fetchApi<{
      user: any;
      session: { access_token: string; refresh_token: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token
    if (result.session?.access_token) {
      localStorage.setItem('luma_auth_token', result.session.access_token);
    }

    // Store user
    if (result.user) {
      localStorage.setItem('luma_user', JSON.stringify(result.user));
    }

    return result;
  },

  async login(data: { email: string; password: string }) {
    const result = await fetchApi<{
      user: any;
      session: { access_token: string; refresh_token: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token
    if (result.session?.access_token) {
      localStorage.setItem('luma_auth_token', result.session.access_token);
    }

    // Store user
    if (result.user) {
      localStorage.setItem('luma_user', JSON.stringify(result.user));
    }

    return result;
  },

  async getCurrentUser() {
    const result = await fetchApi<{ user: any }>('/auth/me', {
      method: 'GET',
    });

    // Update stored user
    if (result.user) {
      localStorage.setItem('luma_user', JSON.stringify(result.user));
    }

    return result.user;
  },

  async logout() {
    await fetchApi('/auth/logout', {
      method: 'POST',
    });

    // Clear stored data
    localStorage.removeItem('luma_auth_token');
    localStorage.removeItem('luma_user');
  },

  async updateProfile(data: {
    name?: string;
    is_new_user?: boolean;
    preferences?: Record<string, any>;
  }) {
    const result = await fetchApi<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    // Update stored user
    if (result.user) {
      localStorage.setItem('luma_user', JSON.stringify(result.user));
    }

    return result.user;
  },
};

// Dashboard API
export const dashboardApi = {
  async submitMoodCheckin(data: { mood_value: number; notes?: string }) {
    return fetchApi<{ mood_checkin: any }>('/dashboard/mood-checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMoodHistory(days: number = 30) {
    return fetchApi<{
      mood_checkins: any[];
      stats: {
        average_mood: number;
        trend_direction: string;
        total_checkins: number;
      };
    }>(`/dashboard/mood-history?days=${days}`, {
      method: 'GET',
    });
  },

  async getDashboardStats() {
    return fetchApi<{
      mood_trend: number[];
      streaks: { journaling: number; reflection: number };
      active_goals_count: number;
      average_mood: number;
      trend_direction: string;
    }>('/dashboard/stats', {
      method: 'GET',
    });
  },
};

// Goals API
export const goalsApi = {
  async createGoal(data: {
    title: string;
    description?: string;
    category: string;
    timeframe: string;
  }) {
    return fetchApi<{
      goal: any;
      clarifications: Array<{
        question: string;
        purpose: string;
      }>;
    }>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitClarifications(
    goalId: string,
    answers: Array<{ questionId: number; answer: string }>
  ) {
    return fetchApi<{
      actionPlan: any;
      planData: {
        smartStatement: string;
        totalSprints: number;
        sprints: Array<{
          sprintNumber: number;
          title: string;
          description: string;
          durationWeeks: number;
          actions: string[];
        }>;
        risks: Array<{
          risk: string;
          mitigation: string;
        }>;
        encouragement: string;
      };
    }>(`/goals/${goalId}/clarifications`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getGoals() {
    return fetchApi<any[]>('/goals', {
      method: 'GET',
    });
  },

  async getGoal(goalId: string) {
    return fetchApi<{
      goal: any;
      actionPlan: {
        id: string;
        smart_statement: string;
        total_sprints: number;
        metadata: {
          risks: Array<{ risk: string; mitigation: string }>;
          encouragement: string;
        };
        milestones: Array<{
          id: string;
          sprint_number: number;
          title: string;
          description: string;
          weekly_actions: Array<{
            id: string;
            action_text: string;
            completed: boolean;
            week_number: number;
          }>;
        }>;
      };
    }>(`/goals/${goalId}`, {
      method: 'GET',
    });
  },

  async updateGoal(
    goalId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      progress?: number;
    }
  ) {
    return fetchApi<any>(`/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleAction(actionId: string, completed: boolean) {
    return fetchApi<any>(`/goals/actions/${actionId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
  },

  async deleteGoal(goalId: string) {
    return fetchApi<{ success: boolean }>(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  },

  async adjustActionPlan(goalId: string, feedback: string) {
    return fetchApi<{
      actionPlan: any;
      planData: {
        smartStatement: string;
        totalSprints: number;
        sprints: Array<{
          sprintNumber: number;
          title: string;
          description: string;
          durationWeeks: number;
          actions: string[];
        }>;
        risks: Array<{
          risk: string;
          mitigation: string;
        }>;
        encouragement: string;
        reasoning?: string;
      };
    }>(`/goals/${goalId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  },
};

// Chat API
export const chatApi = {
  async createConversation(title?: string) {
    return fetchApi<{
      conversation: {
        id: string;
        title: string;
        created_at: string;
      };
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async sendMessage(
    conversationId: string,
    message: string,
    onChunk?: (content: string) => void
  ) {
    const url = `${API_BASE_URL}/chat/${conversationId}/messages`;
    const token = localStorage.getItem('luma_auth_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    // Check if response is streaming (Server-Sent Events)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let userMessage: any = null;
      let assistantMessage: any = null;
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'user_message') {
                  userMessage = data.data;
                } else if (data.type === 'chunk') {
                  fullContent += data.content;
                  onChunk?.(data.content);
                } else if (data.type === 'complete') {
                  assistantMessage = data.data;
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      return { userMessage, assistantMessage };
    } else {
      // Fallback to non-streaming response
      const data = await response.json();
      return data.data;
    }
  },

  async getConversation(conversationId: string) {
    return fetchApi<{
      conversation: any;
      messages: Array<{
        id: string;
        content: string;
        role: 'user' | 'assistant';
        created_at: string;
      }>;
    }>(`/chat/${conversationId}`, {
      method: 'GET',
    });
  },

  async getAllConversations() {
    return fetchApi<{
      conversations: Array<{
        id: string;
        title: string;
        created_at: string;
        message_count: number;
      }>;
    }>('/chat', {
      method: 'GET',
    });
  },
};

// Tools API
export const toolsApi = {
  async createBrainExercise(data: {
    context_description: string;
    original_thought: string;
  }) {
    return fetchApi<{
      exercise: {
        id: string;
        title: string;
        reframe: string;
        micro_action: string;
        why_it_helps: string;
        created_at: string;
      };
      steps: Array<{
        step_number: number;
        instruction: string;
      }>;
    }>('/tools/brain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createNarrative(data: { context_description: string }) {
    return fetchApi<{
      narrative: {
        id: string;
        title: string;
        chapter_past: string;
        chapter_present: string;
        chapter_future: string;
        future_choice: string;
        created_at: string;
      };
    }>('/tools/narrative', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createFutureMeExercise(data: { goal_or_theme: string }) {
    return fetchApi<{
      exercise: {
        id: string;
        visualization_script: string;
        affirmation_1: string;
        affirmation_2: string;
        affirmation_3: string;
        if_then_anchor: string;
        created_at: string;
      };
    }>('/tools/future-me', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Health check
export const healthCheck = async () => {
  return fetchApi<{ message: string; timestamp: string }>('/health', {
    method: 'GET',
  });
};
