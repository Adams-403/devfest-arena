export interface Player {
  id: string;
  name: string;
  code: string;
  score: number;
  joinedAt: number;
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
