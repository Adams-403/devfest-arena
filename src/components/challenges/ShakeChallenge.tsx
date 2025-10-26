import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Smartphone, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const ShakeChallenge: React.FC = () => {
  const [shakeCount, setShakeCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15); // Increased time to 15 seconds for better mobile experience
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

    console.log('Setting up keyboard listener for spacebar...');
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        console.log('Spacebar pressed!');
        setShakeCount(prev => {
          const newCount = prev + 1;
          console.log('Tap count:', newCount);
          return newCount;
        });
      }
    };

    // Add both keydown and keyup to ensure we catch the spacebar press
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('Cleaning up keyboard listener');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, isMobile, isClient]);

  // Handle device motion for mobile
  useEffect(() => {
    if (!isClient || !isActive || !isMobile) return;

    console.log('Setting up motion detection...');
    
    let lastX = 0, lastY = 0, lastZ = 0;
    const SHAKE_THRESHOLD = 8; // Lowered threshold for better sensitivity on mobile
    const SHAKE_TIMEOUT = 30; // Reduced debounce time to 30ms for faster response
    const ACCELERATION_THRESHOLD = 1.5; // Lowered for more sensitivity
    let lastUpdate = 0;
    let shakeTimeout: NodeJS.Timeout;
    
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) {
        console.log('No accelerometer data available');
        return;
      }

      const { x = 0, y = 0, z = 0 } = acc;
      
      // Calculate acceleration vector magnitude
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      // Calculate change in acceleration (using absolute values for more sensitivity)
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);
      
      // Use a more sensitive calculation that emphasizes movement in any direction
      const totalDelta = (deltaX + deltaY + deltaZ) * 1.5;
      
      // More sensitive shake detection with multiple conditions
      const isShaking = totalDelta > SHAKE_THRESHOLD || 
                       (Math.abs(acceleration - 9.81) > ACCELERATION_THRESHOLD && totalDelta > 5);
      
      if (isShaking) {
        const now = Date.now();
        // More responsive shake detection with shorter debounce
        if (now - lastUpdate > SHAKE_TIMEOUT) {
          // Update shake count immediately for better responsiveness
          setShakeCount(prev => {
            const newCount = prev + 1;
            console.log('Shake detected!', { 
              count: newCount,
              accel: { x, y, z },
              delta: { x: deltaX, y: deltaY, z: deltaZ, total: totalDelta },
              acceleration
            });
            return newCount;
          });
          
          lastUpdate = now;
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    // Add the event listener
    console.log('Adding motion event listener');
    window.addEventListener('devicemotion', handleMotion, { passive: true });
    
    return () => {
      console.log('Cleaning up motion detection');
      window.removeEventListener('devicemotion', handleMotion);
      if (shakeTimeout) clearTimeout(shakeTimeout);
    };
  }, [isActive, isMobile, isClient]);

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

  const handleComplete = useCallback(async (): Promise<void> => {
    if (!isActive || !isClient || !currentPlayer) {
      console.log('Challenge not active, not on client, or no current player');
      setIsActive(false);
      return;
    }
    
    // Disable further taps
    setIsActive(false);
    
    // Force a state update to get the latest shakeCount
    const finalShakeCount = await new Promise<number>(resolve => {
      setShakeCount(prev => {
        resolve(prev);
        return prev;
      });
    });
    
    // Calculate points based on platform
    // 300 shakes on mobile, 150 taps on desktop for 5 points
    const threshold = isMobile ? 300 : 150;
    const completedSets = Math.floor(finalShakeCount / threshold);
    const pointsToAdd = completedSets * 5;
    
    console.log('Shake Challenge Complete:', { 
      userId: currentPlayer.id,
      finalShakeCount,
      threshold, 
      completedSets,
      pointsToAdd, 
      isMobile,
      currentScore: currentPlayer.score
    });
    
    try {
      if (pointsToAdd > 0) {
        console.log('Attempting to add points:', pointsToAdd);
        try {
          const newScore = await updateScore(pointsToAdd);
          console.log('Score update successful, new score:', newScore);
          
          toast.success(`Time's up! 🎉`, {
            description: `You ${isMobile ? 'shook' : 'tapped'} ${finalShakeCount} times!\n+${pointsToAdd} points earned (${completedSets} × 5 points per ${threshold} ${isMobile ? 'shakes' : 'taps'})`,
            duration: 8000,
          });
        } catch (error) {
          console.error('Error updating score:', error);
          toast.error('Error updating score. Please try again.', {
            description: `You ${isMobile ? 'shook' : 'tapped'} ${finalShakeCount} times!`,
            duration: 10000,
          });
        }
      } else if (finalShakeCount > 0) {
        console.log('Not enough shakes/taps for points');
        toast.info(`Time's up! ⏱️`, {
          description: `You ${isMobile ? 'shook' : 'tapped'} ${finalShakeCount} times!\n${isMobile ? 'Shake' : 'Tap'} more to earn points! (5 points per ${threshold} ${isMobile ? 'shakes' : 'taps'})`,
          duration: 8000,
        });
      } else {
        console.log('No shakes/taps detected');
        toast.error(`Time's up! 😅`, {
          description: `You didn't ${isMobile ? 'shake' : 'tap'} at all!\nTry again and ${isMobile ? 'shake' : 'tap'} harder next time!`,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Error in handleComplete:', {
        error,
        userId: currentPlayer?.id,
        pointsToAdd,
        shakeCount: finalShakeCount
      });
      
      toast.error('Error updating score. Please try again.', {
        description: 'Your points might not have been saved.',
        duration: 10000,
      });
    }
  }, [isActive, isClient, currentPlayer, isMobile, updateScore]);

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

export default ShakeChallenge;
