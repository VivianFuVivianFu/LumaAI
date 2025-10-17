import { Request, Response } from 'express';
import { GoalsService } from './goals.service';
import {
  CreateGoalInput,
  AnswerClarificationInput,
  UpdateGoalInput,
  ToggleActionInput,
  AdjustActionPlanInput,
} from './goals.schema';
import { sendSuccess, sendError } from '../../utils/response.util';

const goalsService = new GoalsService();

export const createGoal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const input: CreateGoalInput = req.body;
    const result = await goalsService.createGoal(req.userId, input);
    sendSuccess(res, result, 'Goal created', 201);
  } catch (error) {
    console.error('Create goal error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create goal', 500);
  }
};

export const submitClarifications = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { goalId } = req.params;
    const input: AnswerClarificationInput = req.body;
    const result = await goalsService.submitClarifications(goalId, req.userId, input);
    sendSuccess(res, result, 'Action plan generated', 201);
  } catch (error) {
    console.error('Submit clarifications error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to submit clarifications', 500);
  }
};

export const getGoals = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const goals = await goalsService.getGoals(req.userId);
    sendSuccess(res, { goals });
  } catch (error) {
    console.error('Get goals error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get goals', 500);
  }
};

export const getGoal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { goalId } = req.params;
    const result = await goalsService.getGoal(goalId, req.userId);
    sendSuccess(res, result);
  } catch (error) {
    console.error('Get goal error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get goal', 500);
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { goalId } = req.params;
    const updates: UpdateGoalInput = req.body;
    const goal = await goalsService.updateGoal(goalId, req.userId, updates);
    sendSuccess(res, { goal }, 'Goal updated');
  } catch (error) {
    console.error('Update goal error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to update goal', 500);
  }
};

export const toggleAction = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { actionId } = req.params;
    const { completed }: ToggleActionInput = req.body;
    const action = await goalsService.toggleAction(actionId, req.userId, completed);
    sendSuccess(res, { action }, 'Action updated');
  } catch (error) {
    console.error('Toggle action error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to toggle action', 500);
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { goalId } = req.params;
    await goalsService.deleteGoal(goalId, req.userId);
    sendSuccess(res, null, 'Goal deleted');
  } catch (error) {
    console.error('Delete goal error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to delete goal', 500);
  }
};

export const adjustActionPlan = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { goalId } = req.params;
    const input: AdjustActionPlanInput = req.body;
    const result = await goalsService.adjustActionPlan(goalId, req.userId, input.feedback);
    sendSuccess(res, result, 'Action plan adjusted', 200);
  } catch (error) {
    console.error('Adjust action plan error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to adjust action plan', 500);
  }
};
