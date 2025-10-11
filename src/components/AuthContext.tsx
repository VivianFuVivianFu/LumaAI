import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  login: (provider: 'google' | 'hotmail') => Promise<void>;
  register: (name: string, provider: 'google' | 'hotmail') => Promise<void>;
  logout: () => void;
  setUserAsExisting: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API functions - replace with real API calls
const mockApiCall = (endpoint: string, data?: any): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint === '/api/user/status') {
        const storedUser = localStorage.getItem('luma_user');
        const authToken = localStorage.getItem('luma_auth_token');
        
        if (storedUser && authToken) {
          const user = JSON.parse(storedUser);
          resolve({ success: true, user, hasValidSession: true });
        } else {
          resolve({ success: true, user: null, hasValidSession: false });
        }
      } else if (endpoint === '/api/auth/login' || endpoint === '/api/auth/register') {
        const mockUser = {
          id: 'user_123',
          name: data.name || 'User',
          email: `user@${data.provider}.com`,
          is_new_user: endpoint === '/api/auth/register'
        };
        
        // Simulate token storage
        localStorage.setItem('luma_auth_token', 'mock_token_' + Date.now());
        localStorage.setItem('luma_user', JSON.stringify(mockUser));
        
        resolve({ success: true, user: mockUser });
      }
    }, 1000);
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  const checkUserStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await mockApiCall('/api/user/status');
      
      if (response.success && response.user && response.hasValidSession) {
        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const login = async (provider: 'google' | 'hotmail') => {
    try {
      const response = await mockApiCall('/api/auth/login', { provider });
      if (response.success) {
        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const register = async (name: string, provider: 'google' | 'hotmail') => {
    try {
      const response = await mockApiCall('/api/auth/register', { name, provider });
      if (response.success) {
        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('luma_auth_token');
    localStorage.removeItem('luma_user');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  const setUserAsExisting = () => {
    if (authState.user) {
      const updatedUser = { ...authState.user, is_new_user: false };
      localStorage.setItem('luma_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
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