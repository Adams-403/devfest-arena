import { supabase } from './client';

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      access_code: string;
      score: number;
      is_admin: boolean;
      created_at: string;
      updated_at: string;
    };
  };
  error?: string;
};

export type LeaderboardUser = {
  id: string;
  username: string;
  score: number;
  access_code?: string;
  created_at?: string;
  updated_at?: string;
};

export const authService = {
  async login(username: string, accessCode: string): Promise<LoginResponse> {
    try {
      console.log('Login attempt for user:', username);
      
      // Ensure access code is 4 digits
      if (!/^\d{4}$/.test(accessCode)) {
        throw new Error('Access code must be exactly 4 digits');
      }

      // First, check if the user exists using maybeSingle() which won't throw on no rows
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('access_code', accessCode)
        .maybeSingle();

      console.log('User query result:', { users, error });

      if (error) {
        console.error('Database error:', error);
        // Check if it's a 406 error
        if (error.code === 'PGRST116') {
          // No user found with these credentials
          throw new Error('Invalid username or access code');
        }
        throw new Error('Database error. Please try again.');
      }

      if (!users) {
        throw new Error('Invalid username or access code');
      }
      
      // If we get here, we have a valid user
      const user = {
        ...users,
        is_admin: users.is_admin || false // Ensure is_admin is always a boolean
      };

      console.log('Login successful for user:', user.username, 'Admin:', user.is_admin);
      return {
        success: true,
        message: 'Login successful',
        data: { user }
      };
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      });
      return {
        success: false,
        message: error.message || 'An error occurred during login',
        error: error.message,
      };
    }
  },

  async signUp(username: string, accessCode: string): Promise<LoginResponse> {
    try {
      console.log('Signup attempt for user:', username);
      
      // Ensure access code is 4 digits
      if (!/^\d{4}$/.test(accessCode)) {
        throw new Error('Access code must be exactly 4 digits');
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        throw new Error('Error checking user existence');
      }

      if (existingUser) {
        // If user exists, try to log them in instead
        console.log('User exists, attempting login instead');
        return this.login(username, accessCode);
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            username,
            access_code: accessCode,
            score: 0,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        throw new Error(createError.message || 'Failed to create user');
      }

      console.log('User created successfully:', newUser);
      
      return {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            access_code: newUser.access_code,
            score: newUser.score,
            is_admin: newUser.is_admin || false,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
          },
        },
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred during sign up',
        error: error.message,
      };
    }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return data;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async updateScore(userId: string, score: number): Promise<LeaderboardUser | null> {
    const { data, error } = await supabase
      .from('users')
      .update({
        score,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as LeaderboardUser;
  },

  async getUserData(): Promise<LeaderboardUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }

    return data as LeaderboardUser;
  },

  async getLeaderboard(limit = 10): Promise<LeaderboardUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, score, created_at, updated_at')
      .order('score', { ascending: false })
      .limit(limit)
      .returns<LeaderboardUser[]>();

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    
    return data || [];
  },

  async logout(): Promise<{ error?: Error }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error || undefined };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error as Error };
    }
  },
  
  getAllUsers: async (): Promise<LeaderboardUser[]> => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return users || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  },
};
