import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.schema';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logAuthSuccess, logAuthFailure } from '../../utils/security-logger';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);

    // Log successful registration
    logAuthSuccess(req, result.user.id, input.email);

    sendSuccess(res, result, 'Registration successful', 201);
  } catch (error) {
    console.error('Register error:', error);

    // Log failed registration
    logAuthFailure(req, req.body.email, error instanceof Error ? error.message : 'Unknown error');

    sendError(res, error instanceof Error ? error.message : 'Registration failed', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;
    const result = await authService.login(input);

    // Log successful login
    logAuthSuccess(req, result.user.id, input.email);

    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);

    // Log failed login
    logAuthFailure(req, req.body.email, error instanceof Error ? error.message : 'Invalid credentials');

    sendError(res, error instanceof Error ? error.message : 'Login failed', 401);
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (!token) {
      sendError(res, 'No token provided', 401);
      return;
    }

    const user = await authService.getCurrentUser(token);
    sendSuccess(res, { user });
  } catch (error) {
    console.error('Get current user error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to get user', 500);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (!token) {
      sendError(res, 'No token provided', 401);
      return;
    }

    await authService.logout(token);
    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, error instanceof Error ? error.message : 'Logout failed', 500);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const updates: UpdateProfileInput = req.body;
    const user = await authService.updateProfile(req.userId, updates);
    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, error instanceof Error ? error.message : 'Profile update failed', 500);
  }
};
