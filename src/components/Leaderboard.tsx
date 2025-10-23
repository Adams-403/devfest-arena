import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useRef, useState, useEffect } from 'react';

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

  // Find current player's position and element ref
  const playerCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const currentPlayerPosition = currentPlayer 
    ? gameState.leaderboard.findIndex(p => p.id === currentPlayer.id) + 1
    : 0;

  // Reset refs when leaderboard changes
  useEffect(() => {
    playerCardsRef.current = playerCardsRef.current.slice(0, gameState.leaderboard.length);
  }, [gameState.leaderboard]);
    
  const scrollToCurrentPlayer = useCallback(() => {
    if (currentPlayer && currentPlayerPosition > 0 && !isScrolling) {
      setIsScrolling(true);
      const playerCard = playerCardsRef.current[currentPlayerPosition - 1];
      if (playerCard) {
        playerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a highlight effect
        playerCard.classList.add('ring-2', 'ring-primary', 'scale-[1.02]');
        
        const timeoutId = setTimeout(() => {
          playerCard.classList.remove('ring-2', 'ring-primary', 'scale-[1.02]');
          setIsScrolling(false);
        }, 2000);

        return () => clearTimeout(timeoutId);
      }
      setIsScrolling(false);
    }
  }, [currentPlayer, currentPlayerPosition, isScrolling]);

  return (
    <Card className="w-full flex flex-col h-[500px] overflow-hidden">
      <div className="sticky top-0 z-10 bg-card border-b border-border/50">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Live Leaderboard
            </CardTitle>
            {currentPlayer && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToCurrentPlayer();
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer relative group"
                title="Scroll to your position"
                disabled={isScrolling}
              >
                <span className="relative">
                  <span className="relative z-10">
                    Your position: <span className="text-primary font-bold">#{currentPlayerPosition || '--'}</span>
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-px bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                </span>
              </button>
            )}
          </div>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
        {gameState.leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No players yet. Be the first to join!
          </p>
        ) : (
          gameState.leaderboard.map((player, index) => (
            <div
              key={player.id}
              ref={(el) => (playerCardsRef.current[index] = el)}
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
