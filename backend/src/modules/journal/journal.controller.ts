import { Request, Response } from 'express';
import { JournalService } from './journal.service';
import {
  CreateJournalSessionInput,
  CreateJournalEntryInput,
  UpdateJournalSessionInput,
} from './journal.schema';
import { sendSuccess, sendError } from '../../utils/response.util';

const journalService = new JournalService();

export const createSession = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const input: CreateJournalSessionInput = req.body;
    const result = await journalService.createSession(req.userId, input);
    sendSuccess(res, result, 'Journal session created', 201);
  } catch (error) {
    console.error('Create session error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create session', 500);
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const sessions = await journalService.getSessions(req.userId);
    sendSuccess(res, { sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get sessions', 500);
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { sessionId } = req.params;
    const result = await journalService.getSession(sessionId, req.userId);
    sendSuccess(res, result);
  } catch (error) {
    console.error('Get session error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get session', 500);
  }
};

export const createEntry = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { sessionId } = req.params;
    const input: CreateJournalEntryInput = req.body;
    const result = await journalService.createEntry(sessionId, req.userId, input);
    sendSuccess(res, result, 'Journal entry saved', 201);
  } catch (error) {
    console.error('Create entry error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create entry', 500);
  }
};

export const completeSession = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { sessionId } = req.params;
    const session = await journalService.completeSession(sessionId, req.userId);
    sendSuccess(res, { session }, 'Session completed');
  } catch (error) {
    console.error('Complete session error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to complete session', 500);
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { sessionId } = req.params;
    await journalService.deleteSession(sessionId, req.userId);
    sendSuccess(res, null, 'Session deleted');
  } catch (error) {
    console.error('Delete session error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete session', 500);
  }
};
