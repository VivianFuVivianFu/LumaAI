import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  is_new_user: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  checkUserStatus: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserAsExisting: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  const checkUserStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Check if we have a token
      const token = localStorage.getItem('luma_auth_token');
      if (!token) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
        return;
      }

      // Check if session should expire (for non-remember-me users)
      const rememberMe = localStorage.getItem('luma_remember_me') === 'true';
      const loginTimestamp = localStorage.getItem('luma_login_timestamp');

      if (!rememberMe && loginTimestamp) {
        const sessionDuration = Date.now() - parseInt(loginTimestamp);
        const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionDuration > maxSessionDuration) {
          // Session expired, clear auth data
          localStorage.removeItem('luma_auth_token');
          localStorage.removeItem('luma_user');
          localStorage.removeItem('luma_login_timestamp');
          localStorage.removeItem('luma_remember_me');
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
          return;
        }
      }

      // Try to get current user from API
      const user = await authApi.getCurrentUser();

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Error checking user status:', error);
      // Token might be expired, clear it
      localStorage.removeItem('luma_auth_token');
      localStorage.removeItem('luma_user');
      localStorage.removeItem('luma_login_timestamp');
      localStorage.removeItem('luma_remember_me');
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const result = await authApi.login({ email, password });

      // Store remember me preference and login timestamp
      localStorage.setItem('luma_remember_me', rememberMe.toString());
      localStorage.setItem('luma_login_timestamp', Date.now().toString());

      setAuthState({
        user: result.user,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await authApi.register({ name, email, password });

      // New users are automatically remembered (better UX)
      localStorage.setItem('luma_remember_me', 'true');
      localStorage.setItem('luma_login_timestamp', Date.now().toString());

      setAuthState({
        user: result.user,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth-related data
      localStorage.removeItem('luma_remember_me');
      localStorage.removeItem('luma_login_timestamp');
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const setUserAsExisting = async () => {
    if (authState.user) {
      try {
        const updatedUser = await authApi.updateProfile({ is_new_user: false });
        setAuthState(prev => ({
          ...prev,
          user: updatedUser
        }));
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const value: AuthContextType = {
    ...authState,
    checkUserStatus,
    login,
    register,
    logout,
    setUserAsExisting
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
