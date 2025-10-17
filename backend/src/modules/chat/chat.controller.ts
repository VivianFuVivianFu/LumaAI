import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { CreateConversationInput, SendMessageInput, UpdateConversationInput } from './chat.schema';
import { sendSuccess, sendError } from '../../utils/response.util';

const chatService = new ChatService();

export const createConversation = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const input: CreateConversationInput = req.body;
    const conversation = await chatService.createConversation(req.userId, input);
    sendSuccess(res, { conversation }, 'Conversation created', 201);
  } catch (error) {
    console.error('Create conversation error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create conversation', 500);
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const conversations = await chatService.getConversations(req.userId);
    sendSuccess(res, { conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get conversations', 500);
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { conversationId } = req.params;
    const result = await chatService.getConversation(conversationId, req.userId);
    sendSuccess(res, result);
  } catch (error) {
    console.error('Get conversation error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get conversation', 500);
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { conversationId } = req.params;
    const input: SendMessageInput = req.body;

    // Get streaming response
    const streamData = await chatService.sendMessageStream(conversationId, req.userId, input);

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send user message first
    res.write(`data: ${JSON.stringify({
      type: 'user_message',
      data: streamData.userMessage
    })}\n\n`);

    // Stream AI response
    let fullResponse = '';

    for await (const chunk of streamData.stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content
        })}\n\n`);
      }
    }

    // Complete and save
    const assistantMessage = await streamData.onComplete(fullResponse);

    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: assistantMessage
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Send message error:', error);
    // For streaming, send error as SSE
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message'
      })}\n\n`);
      res.end();
    } else {
      sendError(res, error instanceof Error ? error.message : 'Failed to send message', 500);
    }
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { conversationId } = req.params;
    await chatService.deleteConversation(conversationId, req.userId);
    sendSuccess(res, null, 'Conversation deleted');
  } catch (error) {
    console.error('Delete conversation error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete conversation', 500);
  }
};

export const updateConversation = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { conversationId } = req.params;
    const input: UpdateConversationInput = req.body;
    const conversation = await chatService.updateConversation(conversationId, req.userId, input.title);
    sendSuccess(res, { conversation }, 'Conversation updated');
  } catch (error) {
    console.error('Update conversation error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to update conversation', 500);
  }
};
