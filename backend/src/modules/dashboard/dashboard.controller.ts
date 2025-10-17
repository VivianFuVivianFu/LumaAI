import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { MoodCheckinInput } from './dashboard.schema';
import { sendSuccess, sendError } from '../../utils/response.util';

const dashboardService = new DashboardService();

export const submitMoodCheckin = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const input: MoodCheckinInput = req.body;
    const moodCheckin = await dashboardService.submitMoodCheckin(req.userId, input);

    sendSuccess(res, { mood_checkin: moodCheckin }, 'Mood check-in saved successfully', 201);
  } catch (error) {
    console.error('Submit mood checkin error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to save mood check-in', 500);
  }
};

export const getMoodHistory = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const result = await dashboardService.getMoodHistory(req.userId, days);

    sendSuccess(res, result);
  } catch (error) {
    console.error('Get mood history error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get mood history', 500);
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const stats = await dashboardService.getDashboardStats(req.userId);
    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get dashboard stats', 500);
  }
};
