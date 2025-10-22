import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { Rocket, Trophy, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const WelcomeScreen = () => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(true); // Show signup by default
  const [error, setError] = useState('');
  const { login, signUp, setIsAdmin, isAdmin } = useGame();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim() || !/^\d{4}$/.test(code)) {
      setError('Please enter your name and a valid 4-digit access code');
      return;
    }

    try {
      setIsLoading(true);
      if (isSignup) {
        await signUp(name.trim(), code);
        toast({
          title: 'Account created!',
          description: 'Your account has been created successfully.',
        });
      } else {
        await login(name.trim(), code);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || `Failed to ${isSignup ? 'sign up' : 'log in'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminAccess = () => {
    setIsAdmin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Rocket className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            DevFest Arena
          </h1>
          <p className="text-lg text-muted-foreground font-medium">Gombe 2025</p>
        </div>

        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              {isAdmin ? 'Admin Mode' : 'Join the Challenge'}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? 'You are in admin mode. Close this tab to exit.'
                : 'Enter your name and 4-digit access code to join'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Your Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setError('');
                    setName(e.target.value);
                  }}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="code" className="text-sm font-medium">
                    Access Code
                  </label>
                  <span className="text-xs text-muted-foreground">4 digits only</span>
                </div>
                <Input
                  id="code"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  placeholder="1234"
                  value={code}
                  onChange={(e) => {
                    // Only allow numbers and limit to 4 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setCode(value);
                    setError('');
                  }}
                  className="h-12 text-center text-xl font-mono tracking-widest"
                  maxLength={4}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit"
                className="w-full h-12" 
                disabled={isLoading}>
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {isSignup ? (
                      <UserPlus className="mr-2 h-4 w-4" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    {isSignup ? 'Create Account' : 'Enter Arena'}
                  </>
                )}
              </Button>
            </form>
            
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
          <CardFooter className="flex justify-center pt-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
            >
              {isSignup 
                ? 'Already have an account? Log in' 
                : 'Need an account? Sign up'}
            </Button>
          </CardFooter>
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
