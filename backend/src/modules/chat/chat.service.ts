import { supabaseAdmin } from '../../config/supabase.config';
import { openaiService, ChatContext } from '../../services/openai/openai.service';
import { CreateConversationInput, SendMessageInput } from './chat.schema';

interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    input: CreateConversationInput
  ): Promise<Conversation> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        title: input.title || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create conversation');
    }

    return data;
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch conversations');
    }

    return data || [];
  }

  /**
   * Get a single conversation with messages
   */
  async getConversation(conversationId: string, userId: string) {
    // Get conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Get messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new Error('Failed to fetch messages');
    }

    return {
      conversation,
      messages: messages || [],
    };
  }

  /**
   * Send a message and get AI response (with streaming)
   */
  async sendMessageStream(
    conversationId: string,
    userId: string,
    input: SendMessageInput
  ) {
    // OPTIMIZED: Single RPC call to verify conversation, save message, get history & profile
    const { data: chatData, error: rpcError } = await supabaseAdmin
      .rpc('send_chat_message', {
        p_conversation_id: conversationId,
        p_user_id: userId,
        p_message: input.message
      });

    if (rpcError || !chatData) {
      throw new Error('Failed to send message');
    }

    const {
      user_message: userMessage,
      conversation,
      history: conversationHistory,
      user_profile: userProfile
    } = chatData;

    // Build chat context for OpenAI
    const chatContext: ChatContext = {
      userId,
      displayName: userProfile?.name || 'User',
      timezone: userProfile?.preferences?.timezone || 'UTC',
    };

    // Generate AI response using OpenAI STREAMING
    const streamResponse = await openaiService.generateChatResponse(
      input.message,
      chatContext,
      conversationHistory
    );

    return {
      userMessage,
      conversation,
      stream: streamResponse.stream,
      onComplete: async (fullResponse: string) => {
        const finalResponse = await streamResponse.onComplete(fullResponse);

        // Save AI response
        const { data: assistantMessage, error: assistantMsgError } =
          await supabaseAdmin
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: finalResponse,
            })
            .select()
            .single();

        if (assistantMsgError) {
          throw new Error('Failed to save AI response');
        }

        // Update conversation title if it's the first message
        if (!conversation.title) {
          const title =
            input.message.length > 50
              ? input.message.substring(0, 47) + '...'
              : input.message;

          await supabaseAdmin
            .from('conversations')
            .update({ title })
            .eq('id', conversationId);
        }

        return assistantMessage;
      },
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to delete conversation');
    }

    return { success: true };
  }

  /**
   * Update conversation title
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    title: string
  ) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update conversation');
    }

    return data;
  }
}
