import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.util';
import { toolsService } from './tools.service';
import {
  CreateBrainExerciseInput,
  CompleteBrainExerciseInput,
  CreateNarrativeInput,
  SubmitNarrativeReflectionsInput,
  CreateFutureMeInput,
  ReplayFutureMeInput,
  CreateToolSessionInput,
  CompleteToolSessionInput,
} from './tools.schema';

// =====================================================
// 1. EMPOWER MY BRAIN - ENDPOINTS
// =====================================================

export const createBrainExercise = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateBrainExerciseInput;

    const result = await toolsService.createBrainExercise(req.userId!, input);

    sendSuccess(res, result, 'Brain exercise created successfully', 201);
  } catch (error) {
    console.error('Create brain exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create brain exercise', 500);
  }
};

export const getBrainExercises = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const exercises = await toolsService.getBrainExercises(req.userId!, limit, offset);

    sendSuccess(res, { exercises, count: exercises.length }, 'Brain exercises retrieved successfully');
  } catch (error) {
    console.error('Get brain exercises error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get brain exercises', 500);
  }
};

export const getBrainExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await toolsService.getBrainExercise(exerciseId, req.userId!);

    sendSuccess(res, { exercise }, 'Brain exercise retrieved successfully');
  } catch (error) {
    console.error('Get brain exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get brain exercise', 500);
  }
};

export const completeBrainExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const input = req.body as CompleteBrainExerciseInput;

    const exercise = await toolsService.completeBrainExercise(exerciseId, req.userId!, input);

    sendSuccess(res, { exercise }, 'Brain exercise updated successfully');
  } catch (error) {
    console.error('Complete brain exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to complete brain exercise', 500);
  }
};

export const deleteBrainExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;

    await toolsService.deleteBrainExercise(exerciseId, req.userId!);

    sendSuccess(res, null, 'Brain exercise deleted successfully');
  } catch (error) {
    console.error('Delete brain exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete brain exercise', 500);
  }
};

// =====================================================
// 2. MY NEW NARRATIVE - ENDPOINTS
// =====================================================

export const createNarrative = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateNarrativeInput;

    const result = await toolsService.createNarrative(req.userId!, input);

    sendSuccess(res, result, 'Narrative created successfully', 201);
  } catch (error) {
    console.error('Create narrative error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create narrative', 500);
  }
};

export const submitNarrativeReflections = async (req: Request, res: Response) => {
  try {
    const { narrativeId } = req.params;
    const input = req.body as SubmitNarrativeReflectionsInput;

    const narrative = await toolsService.submitNarrativeReflections(narrativeId, req.userId!, input);

    sendSuccess(res, { narrative }, 'Narrative reflections submitted successfully');
  } catch (error) {
    console.error('Submit narrative reflections error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to submit narrative reflections', 500);
  }
};

export const getNarratives = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const narratives = await toolsService.getNarratives(req.userId!, limit, offset);

    sendSuccess(res, { narratives, count: narratives.length }, 'Narratives retrieved successfully');
  } catch (error) {
    console.error('Get narratives error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get narratives', 500);
  }
};

export const getNarrative = async (req: Request, res: Response) => {
  try {
    const { narrativeId } = req.params;

    const narrative = await toolsService.getNarrative(narrativeId, req.userId!);

    sendSuccess(res, { narrative }, 'Narrative retrieved successfully');
  } catch (error) {
    console.error('Get narrative error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get narrative', 500);
  }
};

export const deleteNarrative = async (req: Request, res: Response) => {
  try {
    const { narrativeId } = req.params;

    await toolsService.deleteNarrative(narrativeId, req.userId!);

    sendSuccess(res, null, 'Narrative deleted successfully');
  } catch (error) {
    console.error('Delete narrative error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete narrative', 500);
  }
};

// =====================================================
// 3. FUTURE ME - ENDPOINTS
// =====================================================

export const createFutureMeExercise = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateFutureMeInput;

    const result = await toolsService.createFutureMeExercise(req.userId!, input);

    sendSuccess(res, result, 'Future Me exercise created successfully', 201);
  } catch (error) {
    console.error('Create Future Me exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create Future Me exercise', 500);
  }
};

export const replayFutureMeExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const input = req.body as ReplayFutureMeInput;

    const exercise = await toolsService.replayFutureMeExercise(exerciseId, req.userId!, input);

    sendSuccess(res, { exercise }, 'Future Me exercise replayed successfully');
  } catch (error) {
    console.error('Replay Future Me exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to replay Future Me exercise', 500);
  }
};

export const getFutureMeExercises = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const exercises = await toolsService.getFutureMeExercises(req.userId!, limit, offset);

    sendSuccess(res, { exercises, count: exercises.length }, 'Future Me exercises retrieved successfully');
  } catch (error) {
    console.error('Get Future Me exercises error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get Future Me exercises', 500);
  }
};

export const getFutureMeExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await toolsService.getFutureMeExercise(exerciseId, req.userId!);

    sendSuccess(res, { exercise }, 'Future Me exercise retrieved successfully');
  } catch (error) {
    console.error('Get Future Me exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get Future Me exercise', 500);
  }
};

export const deleteFutureMeExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;

    await toolsService.deleteFutureMeExercise(exerciseId, req.userId!);

    sendSuccess(res, null, 'Future Me exercise deleted successfully');
  } catch (error) {
    console.error('Delete Future Me exercise error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete Future Me exercise', 500);
  }
};

// =====================================================
// 4. TOOL SESSIONS - ENDPOINTS
// =====================================================

export const createToolSession = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateToolSessionInput;

    const session = await toolsService.createToolSession(req.userId!, input);

    sendSuccess(res, { session }, 'Tool session created successfully', 201);
  } catch (error) {
    console.error('Create tool session error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create tool session', 500);
  }
};

export const completeToolSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const input = req.body as CompleteToolSessionInput;

    const session = await toolsService.completeToolSession(sessionId, req.userId!, input);

    sendSuccess(res, { session }, 'Tool session completed successfully');
  } catch (error) {
    console.error('Complete tool session error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to complete tool session', 500);
  }
};

export const getToolSessions = async (req: Request, res: Response) => {
  try {
    const toolType = req.query.tool_type as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await toolsService.getToolSessions(req.userId!, toolType, limit, offset);

    sendSuccess(res, { sessions, count: sessions.length }, 'Tool sessions retrieved successfully');
  } catch (error) {
    console.error('Get tool sessions error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get tool sessions', 500);
  }
};
