import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, Challenge, GameState } from '@/types/game';

interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  joinGame: (name: string, code: string) => void;
  startChallenge: (challengeId: string) => void;
  endChallenge: () => void;
  updateScore: (playerId: string, points: number) => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
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
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('devfest-game-state');
    return saved ? JSON.parse(saved) : {
      players: [],
      currentChallenge: null,
      challenges: INITIAL_CHALLENGES,
      leaderboard: []
    };
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    const saved = localStorage.getItem('devfest-current-player');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('devfest-is-admin') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('devfest-game-state', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (currentPlayer) {
      localStorage.setItem('devfest-current-player', JSON.stringify(currentPlayer));
    }
  }, [currentPlayer]);

  useEffect(() => {
    localStorage.setItem('devfest-is-admin', isAdmin.toString());
  }, [isAdmin]);

  const joinGame = (name: string, code: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      code,
      score: 0,
      joinedAt: Date.now()
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
      leaderboard: [...prev.players, newPlayer].sort((a, b) => b.score - a.score)
    }));

    setCurrentPlayer(newPlayer);
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

  const updateScore = (playerId: string, points: number) => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map(p => 
        p.id === playerId ? { ...p, score: p.score + points } : p
      );

      const updatedLeaderboard = [...updatedPlayers].sort((a, b) => b.score - a.score);

      return {
        ...prev,
        players: updatedPlayers,
        leaderboard: updatedLeaderboard
      };
    });

    if (currentPlayer?.id === playerId) {
      setCurrentPlayer(prev => prev ? { ...prev, score: prev.score + points } : null);
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      currentPlayer,
      joinGame,
      startChallenge,
      endChallenge,
      updateScore,
      isAdmin,
      setIsAdmin
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
