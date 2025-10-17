import { supabase, supabaseAdmin } from '../../config/supabase.config';
import { RegisterInput, LoginInput } from './auth.schema';
import { UserProfile } from '../../types/user.types';

export class AuthService {
  async register(input: RegisterInput) {
    const { email, password, name } = input;

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed: No user returned');
    }

    // Fetch user profile (created by trigger)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn('Profile fetch warning:', profileError.message);
    }

    return {
      user: profile || {
        id: data.user.id,
        email: data.user.email!,
        name,
        is_new_user: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: {},
      },
      session: data.session,
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error('Invalid email or password');
    }

    if (!data.user) {
      throw new Error('Login failed: No user returned');
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    return {
      user: profile,
      session: data.session,
    };
  }

  async getCurrentUser(token: string): Promise<UserProfile> {
    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    return profile;
  }

  async logout(token: string) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error('Logout failed');
    }

    return { success: true };
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update profile');
    }

    return data;
  }
}
