export interface Player {
  id: string;
  name: string;
  username: string;
  score: number;
  isAdmin?: boolean; // Made optional to match existing code
  joinedAt: number;
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  code?: string;
  access_code?: string;
}

export interface Challenge {
  id: string;
  type: 'shake' | 'poll' | 'lucky-tap' | 'emoji' | 'predict' | 'speaker' | 'photo';
  title: string;
  description: string;
  active: boolean;
  startTime?: number;
  duration: number; // in seconds
}

export interface GameState {
  players: Player[];
  currentChallenge: Challenge | null;
  challenges: Challenge[];
  leaderboard: Player[];
}
