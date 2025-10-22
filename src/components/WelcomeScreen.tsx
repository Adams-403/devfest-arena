import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { Rocket, Trophy, Zap } from 'lucide-react';

export const WelcomeScreen = () => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const { joinGame, setIsAdmin } = useGame();

  const handleJoin = () => {
    if (name.trim() && code.trim()) {
      joinGame(name.trim(), code.trim());
    }
  };

  const handleAdminAccess = () => {
    setIsAdmin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Rocket className="h-16 w-16 text-white animate-bounce" />
              <Zap className="h-8 w-8 text-accent absolute -right-2 -top-2" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            DevFest Arena
          </h1>
          <p className="text-xl text-white/90">Gombe 2025</p>
        </div>

        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Join the Challenge
            </CardTitle>
            <CardDescription>
              Enter your details to compete in real-time challenges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Access Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button 
              onClick={handleJoin}
              disabled={!name.trim() || !code.trim()}
              className="w-full text-lg h-12 bg-primary hover:bg-primary/90"
              size="lg"
            >
              Enter Arena
            </Button>
            
            <div className="pt-4 border-t">
              <Button
                onClick={handleAdminAccess}
                variant="outline"
                className="w-full"
              >
                Admin Access
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <p className="text-2xl font-bold text-white">4</p>
            <p className="text-sm text-white/80">Challenges</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <p className="text-2xl font-bold text-white">Live</p>
            <p className="text-sm text-white/80">Leaderboard</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <p className="text-2xl font-bold text-white">∞</p>
            <p className="text-sm text-white/80">Fun</p>
          </div>
        </div>
      </div>
    </div>
  );
};
