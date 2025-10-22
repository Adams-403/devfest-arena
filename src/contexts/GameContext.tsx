import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player, Challenge, GameState } from '@/types/game';
import { authService } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; username: string; score: number }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing user in localStorage on initial load
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentPlayer(user);
          setIsAuthenticated(true);
          await fetchLeaderboard();
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
        // Clear invalid stored user
        localStorage.removeItem('currentUser');
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
        const player: Player = {
          id: userData.id,
          name: userData.username,
          username: userData.username,
          score: userData.score || 0,
          isAdmin: false, // You can implement admin check if needed
          joinedAt: new Date(userData.created_at).getTime(),
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          // Legacy fields
          code: userData.access_code,
          access_code: userData.access_code
        };
        
        // Store user in state and localStorage
        setCurrentPlayer(player);
        setIsAuthenticated(true);
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
      // Clear user data from state and localStorage
      setCurrentPlayer(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAuthError(null);
      localStorage.removeItem('currentUser');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        variant: 'destructive',
      });
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
      
      setLeaderboard(leaderboardData.map((user: any) => ({
        id: user.id,
        username: user.username,
        score: user.score
      })));
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
          isAdmin: false,
          joinedAt: new Date(userData.created_at).getTime(),
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          code: userData.access_code,
          access_code: userData.access_code
        };
        
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      currentPlayer,
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
      loading
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
