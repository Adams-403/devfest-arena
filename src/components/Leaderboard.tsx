import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Leaderboard = () => {
  const { gameState, currentPlayer } = useGame();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-accent" />;
      case 1:
        return <Medal className="h-6 w-6 text-muted-foreground" />;
      case 2:
        return <Award className="h-6 w-6 text-[hsl(30,100%,50%)]" />;
      default:
        return null;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-green-400/10 border-green-400';
      case 1:
        return 'bg-yellow-400/10 border-yellow-400';
      case 2:
        return 'bg-blue-400/10 border-blue-400';
      case 3:
        return 'bg-red-400/10 border-red-400';
      default:
        return 'bg-transparent border-border';
    }
  };

  // Find current player's position
  const currentPlayerPosition = currentPlayer 
    ? gameState.leaderboard.findIndex(p => p.id === currentPlayer.id) + 1
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Live Leaderboard
          </CardTitle>
          {currentPlayer && (
            <span className="text-sm text-muted-foreground">
              Your position: #{currentPlayerPosition || '--'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {gameState.leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No players yet. Be the first to join!
          </p>
        ) : (
          gameState.leaderboard.map((player, index) => (
            <div
              key={player.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2 transition-all',
                getRankBg(index),
                currentPlayer?.id === player.id && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index) || (
                    <span className="font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{player.name}</p>
                  {currentPlayer?.id === player.id && (
                    <p className="text-xs text-muted-foreground">You</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{player.score}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
