import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Smartphone, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const ShakeChallenge: React.FC = () => {
  const [shakeCount, setShakeCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { currentPlayer, updateScore } = useGame();

  // Ensure we're on the client before accessing window
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]); // Removed shakeCount from dependencies

  // Handle completion when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && isActive) {
      handleComplete();
    }
  }, [timeLeft, isActive]);

  // Handle keyboard input for desktop
  useEffect(() => {
    if (!isClient || !isActive || isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setShakeCount(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isMobile]);

  // Handle device motion for mobile
  useEffect(() => {
    if (!isClient || !isActive || !isMobile) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let shakeThreshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const { x = 0, y = 0, z = 0 } = acc;
      
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      if (deltaX + deltaY + deltaZ > shakeThreshold) {
        setShakeCount(prev => prev + 1);
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isActive, isMobile]);

  const handleStart = async () => {
    // Reset states first
    setShakeCount(0);
    setTimeLeft(10);
    
    if (isMobile) {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission !== 'granted') {
            toast.error('Motion permission required');
            return;
          }
        } catch (error) {
          toast.error('Could not get motion permission');
          return;
        }
      }
    }

    // Start the challenge after any permission checks
    setIsActive(true);
  };

  const handleComplete = useCallback(async () => {
    if (!isActive || !isClient) return;
    
    // Calculate points based on platform
    const threshold = isMobile ? 300 : 150; // 300 shakes on mobile, 150 taps on desktop
    const completedSets = Math.floor(shakeCount / threshold);
    const pointsToAdd = completedSets * 5;
    
    console.log('Shake Challenge Complete:', { 
      shakeCount, 
      threshold, 
      completedSets,
      pointsToAdd, 
      isMobile 
    });
    
    try {
      if (shakeCount > 0) {
        if (pointsToAdd > 0) {
          await updateScore(pointsToAdd);
          toast.success(`Time's up! 🎉`, {
            description: `You ${isMobile ? 'shook' : 'tapped'} ${shakeCount} times!\n+${pointsToAdd} points earned (${completedSets} × 5 points per ${threshold} ${isMobile ? 'shakes' : 'taps'})`,
            duration: 8000,
          });
        } else {
          toast.info(`Time's up! ⏱️`, {
            description: `You ${isMobile ? 'shook' : 'tapped'} ${shakeCount} times!\n${isMobile ? 'Shake' : 'Tap'} more to earn points! (5 points per ${threshold} ${isMobile ? 'shakes' : 'taps'})`,
            duration: 8000,
          });
        }
      } else {
        toast.error(`Time's up! 😅`, {
          description: `You didn't ${isMobile ? 'shake' : 'tap'} at all!\nTry again and ${isMobile ? 'shake' : 'tap'} harder next time!`,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Error updating score. Please try again.');
    }
    
    setIsActive(false);
  }, [isActive, shakeCount, updateScore, isMobile, isClient]);

  return (
    <Card className="border-2 border-primary w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isMobile ? (
            <Smartphone className="h-6 w-6 text-primary" />
          ) : (
            <Keyboard className="h-6 w-6 text-primary" />
          )}
          {isMobile ? 'Shake War' : 'Tap War'}
        </CardTitle>
        <CardDescription>
          {isMobile ? (
            'Shake your phone as fast as you can in 10 seconds! (5 points per 300 shakes)'
          ) : (
            'Press the SPACEBAR as fast as you can in 10 seconds! (5 points per 150 taps)'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isActive ? (
          <Button onClick={handleStart} className="w-full h-16 text-xl" size="lg">
            {isMobile ? 'Start Shaking!' : 'Start Tapping!'}
          </Button>
        ) : (
          <>
            <div className="text-center space-y-4">
              <div className="bg-primary/10 rounded-lg p-8">
                <p className="text-6xl font-bold text-primary animate-pulse">
                  {shakeCount}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isMobile ? 'Shakes' : 'Taps'}
                </p>
              </div>
              <div className="bg-secondary/10 rounded-lg p-4">
                <p className="text-4xl font-bold text-secondary">{timeLeft}s</p>
                <p className="text-sm text-muted-foreground">Time remaining</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              🔥 Shake harder! Keep going!
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
