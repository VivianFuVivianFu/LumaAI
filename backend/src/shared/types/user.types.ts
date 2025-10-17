export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_new_user: boolean;
  preferences: Record<string, any>;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  is_new_user?: boolean;
  preferences?: Record<string, any>;
}
