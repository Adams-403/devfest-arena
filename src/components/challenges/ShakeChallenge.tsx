import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export const ShakeChallenge = () => {
  const [shakeCount, setShakeCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const { currentPlayer, updateScore } = useGame();

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
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

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
  }, [isActive]);

  const handleStart = async () => {
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

    setIsActive(true);
    setShakeCount(0);
    setTimeLeft(10);
  };

  const handleComplete = () => {
    if (currentPlayer && shakeCount > 0) {
      updateScore(currentPlayer.id, shakeCount);
      toast.success(`You scored ${shakeCount} shakes!`, {
        description: `+${shakeCount} points added to your score`
      });
    }
    setIsActive(false);
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          Shake War
        </CardTitle>
        <CardDescription>
          Shake your phone as fast as you can in 10 seconds!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isActive ? (
          <Button onClick={handleStart} className="w-full h-16 text-xl" size="lg">
            Start Shaking!
          </Button>
        ) : (
          <>
            <div className="text-center space-y-4">
              <div className="bg-primary/10 rounded-lg p-8">
                <p className="text-6xl font-bold text-primary animate-pulse">
                  {shakeCount}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Shakes</p>
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
