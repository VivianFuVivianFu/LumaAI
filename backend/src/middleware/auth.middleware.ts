import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.config';
import { sendError } from '../utils/response.util';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No authorization token provided', 401);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      sendError(res, 'Invalid or expired token', 401);
      return;
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendError(res, 'Authentication failed', 401);
  }
};
