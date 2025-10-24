import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const LuckyTapChallenge = () => {
  const [circles, setCircles] = useState<number[]>([]);
  const [luckyCircle, setLuckyCircle] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const { currentPlayer, updateScore } = useGame();

  const startChallenge = () => {
    const circleArray = Array.from({ length: 10 }, (_, i) => i);
    const lucky = Math.floor(Math.random() * 10);
    
    setCircles(circleArray);
    setLuckyCircle(lucky);
    setIsActive(true);
    setSelected(null);

    setTimeout(() => {
      if (selected === null) {
        toast.error('Time\'s up!');
        setIsActive(false);
      }
    }, 3000);
  };

  const handleTap = (index: number) => {
    if (!isActive || selected !== null) return;

    setSelected(index);
    setIsActive(false);

    if (index === luckyCircle && currentPlayer) {
      updateScore(10);
      toast.success('🎉 Lucky tap! +10 points', {
        description: 'You found the lucky circle!'
      });
    } else {
      toast.error('Not the lucky one! Try again');
    }
  };

  return (
    <Card className="border-2 border-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          Lucky Tap
        </CardTitle>
        <CardDescription>
          Tap the lucky circle in 3 seconds!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isActive && circles.length === 0 ? (
          <Button onClick={startChallenge} className="w-full h-16 text-xl bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
            Start Challenge
          </Button>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-3">
              {circles.map((circle) => (
                <button
                  key={circle}
                  onClick={() => handleTap(circle)}
                  disabled={!isActive || selected !== null}
                  className={cn(
                    "aspect-square rounded-full transition-all duration-300",
                    selected === null && isActive && "bg-primary hover:bg-primary/80 animate-pulse",
                    selected === circle && circle === luckyCircle && "bg-accent scale-110",
                    selected === circle && circle !== luckyCircle && "bg-destructive scale-90",
                    selected !== null && circle === luckyCircle && "bg-accent animate-bounce",
                    selected !== null && circle !== luckyCircle && selected !== circle && "bg-muted opacity-50"
                  )}
                />
              ))}
            </div>

            {selected !== null && (
              <Button 
                onClick={startChallenge} 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Try Again
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
