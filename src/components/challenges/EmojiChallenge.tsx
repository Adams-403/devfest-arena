import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Smile } from 'lucide-react';
import { toast } from 'sonner';

const EMOJIS = ['😀', '😂', '💀', '🔥', '❤️', '🎉', '🚀', '⚡', '🎯', '👑'];

export const EmojiChallenge = () => {
  const [targetEmoji, setTargetEmoji] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const { currentPlayer, updateScore } = useGame();

  useEffect(() => {
    startChallenge();
  }, []);

  const startChallenge = () => {
    const target = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const shuffled = [...EMOJIS].sort(() => Math.random() - 0.5);
    
    setTargetEmoji(target);
    setOptions(shuffled);
    setIsActive(true);
    setStartTime(Date.now());
  };

  const handleSelect = async (emoji: string) => {
    if (!isActive) return;

    const responseTime = Date.now() - startTime;
    const isCorrect = emoji === targetEmoji;

    setIsActive(false);

    try {
      if (currentPlayer) {
        const points = isCorrect ? 1 : -1;
        await updateScore(points);
        
        if (isCorrect) {
          toast.success('Correct! +1 point', {
            description: `Response time: ${(responseTime / 1000).toFixed(2)}s`,
            icon: emoji
          });
        } else {
          toast.error('Wrong emoji! -1 point', {
            icon: '❌',
            description: `The correct answer was ${targetEmoji}`
          });
        }
      } else {
        toast.error('Player not found', {
          icon: '❌',
          description: 'Unable to update score'
        });
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Error updating score', {
        icon: '❌',
        description: 'Please try again'
      });
    }
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="h-6 w-6 text-primary" />
          Emoji Battle
        </CardTitle>
        <CardDescription>
          Tap the matching emoji as fast as possible!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
          <>
            <div className="bg-primary/10 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Match this:</p>
              <p className="text-8xl animate-bounce">{targetEmoji}</p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {options.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(emoji)}
                  disabled={!isActive}
                  className="aspect-square text-4xl hover:scale-110 transition-transform disabled:opacity-50 bg-card rounded-lg border-2 border-border hover:border-primary"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {!isActive && targetEmoji && (
              <Button onClick={startChallenge} className="w-full">
                Next Round
              </Button>
            )}
          </>
      </CardContent>
    </Card>
  );
};
