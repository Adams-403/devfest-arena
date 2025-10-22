import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player, Challenge, GameState } from '@/types/game';
import { authService } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

interface User {
  id: string;
  username: string;
  score: number;
  is_admin?: boolean;
  access_code?: string;
  created_at?: string;
  updated_at?: string;
}

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  allUsers: User[];
  fetchAllUsers: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, accessCode: string) => Promise<{ success: boolean }>;
  signUp: (username: string, accessCode: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  updateScore: (score: number) => Promise<void>;
  leaderboard: Array<{ id: string; username: string; score: number }>;
  refreshLeaderboard: () => Promise<void>;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  authError: string | null;
  loading: boolean;
  startChallenge: (challengeId: string) => void;
  endChallenge: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: '1',
    type: 'poll',
    title: 'Rapid Fire Polls',
    description: 'Answer quick questions about tech preferences',
    active: false,
    duration: 30
  },
  {
    id: '2',
    type: 'shake',
    title: 'Shake War',
    description: 'Shake your phone as fast as you can!',
    active: false,
    duration: 10
  },
  {
    id: '3',
    type: 'lucky-tap',
    title: 'Lucky Tap',
    description: 'Tap the lucky circle and win!',
    active: false,
    duration: 5
  },
  {
    id: '4',
    type: 'emoji',
    title: 'Emoji Battle',
    description: 'Tap the matching emoji as fast as possible',
    active: false,
    duration: 15
  }
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    players: [],
    currentChallenge: null,
    challenges: INITIAL_CHALLENGES,
    leaderboard: []
  }));

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; username: string; score: number }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllUsers = async () => {
    try {
      const users = await authService.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  };

  // Check admin status from the server
  const checkAdminStatus = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      return data?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Set up real-time subscription for leaderboard updates
  useEffect(() => {
    // Initial fetch of all users
    fetchAllUsers();
    
    // Set up real-time subscription for users table
    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        }, 
        (payload) => {
          console.log('Users table changed:', payload);
          fetchLeaderboard();
          fetchAllUsers();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(usersSubscription);
    };
  }, []);

  // Check for existing user in localStorage on initial load
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // First check the separate isAdmin flag for faster initial load
          const cachedIsAdmin = localStorage.getItem('isAdmin') === 'true';
          
          // Set initial state from localStorage for immediate UI update
          setCurrentPlayer({
            ...user,
            isAdmin: cachedIsAdmin
          });
          setIsAuthenticated(true);
          setIsAdmin(cachedIsAdmin);
          
          // Then verify admin status from the server in the background
          const isUserAdmin = await checkAdminStatus(user.username);
          
          // Only update if the server response differs from our cached value
          if (isUserAdmin !== cachedIsAdmin) {
            const updatedUser = {
              ...user,
              isAdmin: isUserAdmin
            };
            
            setCurrentPlayer(updatedUser);
            setIsAdmin(isUserAdmin);
            
            // Update localStorage with the latest data
            localStorage.setItem('isAdmin', String(isUserAdmin));
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }
          
          await fetchLeaderboard();
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
        // Clear invalid stored user
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
        setCurrentPlayer(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (username: string, accessCode: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const response = await authService.login(username, accessCode);
      
      if (response.success && response.data?.user) {
        const userData = response.data.user;
        
        // Double-check admin status from the server
        const isUserAdmin = await checkAdminStatus(username);
        
        const player: Player = {
          id: userData.id,
          name: userData.username,
          username: userData.username,
          score: userData.score || 0,
          isAdmin: isUserAdmin, // Use the verified admin status
          joinedAt: new Date(userData.created_at).getTime(),
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          // Legacy fields
          code: userData.access_code,
          access_code: userData.access_code
        };
        
        // Set admin state
        setIsAdmin(isUserAdmin);
        
        // Store user in state and localStorage
        setCurrentPlayer(player);
        setIsAuthenticated(true);
        
        // Also store the admin status in a separate localStorage key for quick access
        localStorage.setItem('isAdmin', String(isUserAdmin));
        localStorage.setItem('currentUser', JSON.stringify(player));
        
        // Refresh leaderboard
        await fetchLeaderboard();
        
        // Show success message
        toast({
          title: 'Welcome!',
          description: `Welcome to DevFest Arena, ${player.name}!`,
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'An error occurred during login';
      setAuthError(errorMessage);
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Show success message
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Show error message
      toast({
        title: 'Logout Failed',
        description: error instanceof Error ? error.message : 'An error occurred while logging out.',
        variant: 'destructive',
      });
    } finally {
      // Clear all state and storage
      setCurrentPlayer(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAuthError(null);
      
      // Clear all auth-related data from localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminView');
    }
  };

  const startChallenge = (challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (!challenge) return prev;

      return {
        ...prev,
        currentChallenge: {
          ...challenge,
          active: true,
          startTime: Date.now()
        },
        challenges: prev.challenges.map(c => 
          c.id === challengeId ? { ...c, active: true, startTime: Date.now() } : { ...c, active: false }
        )
      };
    });
  };

  const endChallenge = () => {
    setGameState(prev => ({
      ...prev,
      currentChallenge: null,
      challenges: prev.challenges.map(c => ({ ...c, active: false }))
    }));
  };

  const updateScore = async (score: number) => {
    if (!currentPlayer) return;
    
    try {
      const updatedUser = await authService.updateScore(currentPlayer.id, score);
      
      if (updatedUser) {
        setCurrentPlayer(prev => prev ? { 
          ...prev, 
          score: updatedUser.score,
          updated_at: updatedUser.updated_at
        } : null);
        
        await fetchLeaderboard();
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast({
        title: 'Error',
        description: 'Failed to update score',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const leaderboardData = await authService.getLeaderboard();
      const now = Date.now();
      
      const formattedLeaderboard = leaderboardData.map((user: any) => ({
        id: user.id,
        name: user.username,
        username: user.username,
        score: user.score,
        isAdmin: user.is_admin || false,
        joinedAt: user.created_at ? new Date(user.created_at).getTime() : now,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        code: user.access_code || '',
        access_code: user.access_code || ''
      }));
      
      setLeaderboard(formattedLeaderboard);
      
      // Also update the gameState with the leaderboard data
      setGameState(prev => ({
        ...prev,
        leaderboard: formattedLeaderboard
      }));
      
      // Update currentPlayer's score if they are in the leaderboard
      if (currentPlayer) {
        const currentPlayerInLeaderboard = formattedLeaderboard.find(
          (player: any) => player.id === currentPlayer.id
        );
        
        if (currentPlayerInLeaderboard && currentPlayerInLeaderboard.score !== currentPlayer.score) {
          setCurrentPlayer(prev => prev ? { 
            ...prev, 
            score: currentPlayerInLeaderboard.score,
            updated_at: currentPlayerInLeaderboard.updated_at
          } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const refreshLeaderboard = useCallback(async () => {
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const signUp = async (username: string, accessCode: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const response = await authService.signUp(username, accessCode);
      
      if (response.success && response.data?.user) {
        const userData = response.data.user;
        const player: Player = {
          id: userData.id,
          name: userData.username,
          username: userData.username,
          score: userData.score || 0,
          isAdmin: userData.is_admin || false,
          joinedAt: new Date(userData.created_at).getTime(),
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          code: userData.access_code,
          access_code: userData.access_code
        };
        
        // Set admin state
        setIsAdmin(player.isAdmin);
        
        // Store user in state and localStorage
        setCurrentPlayer(player);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(player));
        
        // Refresh leaderboard
        await fetchLeaderboard();
        
        toast({
          title: 'Welcome!',
          description: `Welcome to DevFest Arena, ${player.name}!`,
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || 'An error occurred during signup';
      setAuthError(errorMessage);
      
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
      setIsLoading(false);
    }
  };

  // The actual return statement for the component
  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer: currentPlayer as Player,
        allUsers,
        fetchAllUsers,
        isAuthenticated,
        isLoading,
        login,
        signUp,
        logout,
        updateScore,
        leaderboard,
        refreshLeaderboard,
        isAdmin,
        setIsAdmin,
        authError,
        loading,
        startChallenge,
        endChallenge,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
