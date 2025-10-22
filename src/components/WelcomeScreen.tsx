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

  return (
    <div className="min-h-screen lg:h-screen bg-gdg-pattern bg-gradient-to-br from-background to-card/80 flex items-center justify-center p-6 lg:py-0 overflow-auto lg:overflow-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Left: big visual / branding */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-3 lg:gap-6 px-4">
          <div className="relative">
            <div className="inline-flex items-center justify-center rounded-full p-3 bg-[rgba(255,255,255,0.03)] ring-2 ring-offset-2 ring-[hsla(var(--primary)/0.18)]">
              <img
                src="/assets/0216-GfD-DevFest-Toolkit-Stickers-06.png"
                alt="DevFest Logo"
                className="h-40 md:h-56 lg:h-72 xl:h-80 w-auto object-contain block drop-shadow-lg"
                style={{ margin: 0 }}
              />
            </div>
          </div>

          <h1 className="text-lg md:text-2xl lg:text-3xl font-semibold text-muted-foreground">Gombe 2025</h1>
          <p className="max-w-md text-sm md:text-base text-muted-foreground/80">Join the GDG-powered DevFest arena — friendly competition, real-time leaderboards, and lots of stickers. Ready to play?</p>
        </div>

        {/* Right: auth card + stats */}
        <div className="flex flex-col items-center px-4">
          <div className="w-full max-w-md">
            <Card className="bg-black/95 border-2 border-[hsl(var(--primary))] shadow-lg gdg-card-highlight">
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
                  placeholder="username here"
                  value={name}
                  onChange={(e) => {
                    setError('');
                    setName(e.target.value);
                  }}
                  className="h-8 text-sm bg-transparent text-white placeholder:text-white/60"
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
                  placeholder="password here"
                  value={code}
                  onChange={(e) => {
                    // Only allow numbers and limit to 4 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setCode(value);
                    setError('');
                  }}
                  className="h-8 text-sm text-center font-mono tracking-widest bg-transparent text-white placeholder:text-white/60"
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
            
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground w-full"
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

            <div className="grid grid-cols-3 gap-4 text-center mt-4">
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
      </div>
    </div>
  );
};
