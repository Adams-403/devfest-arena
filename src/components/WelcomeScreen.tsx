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
            <div className="google-border p-1 md:p-1.5 lg:p-2 w-56 sm:w-64 md:w-72 lg:w-80 xl:w-88">
              <div className="google-border-inner w-full h-full p-2 md:p-4">
                <img
                  src="/assets/0216-GfD-DevFest-Toolkit-Stickers-06.png"
                  alt="DevFest Logo"
                  className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 object-contain block drop-shadow-2xl"
                  style={{ margin: 0 }}
                />
              </div>
            </div>
          </div>

          <h1 className="text-lg md:text-2xl lg:text-3xl font-semibold text-muted-foreground">Gombe 2025</h1>
          <p className="max-w-md text-sm md:text-base text-muted-foreground/80">Join the GDG-powered DevFest arena — friendly competition, real-time leaderboards, and lots of stickers. Ready to play?</p>
        </div>

        {/* Right: auth card + stats */}
        <div className="flex flex-col items-center px-4">
          <div className="w-full max-w-md">
            <Card className="bg-black/95 border border-[hsl(var(--accent))] shadow-lg gdg-card-highlight">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  {isAdmin ? 'Admin Mode' : 'Join the Challenge'}
                </CardTitle>
                <CardDescription>
                  {isAdmin ? 'You are in admin mode. Close this tab to exit.' : 'Enter your name and 4-digit access code to join'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-3">
                  <div>
                    <label htmlFor="name" className="text-xs font-medium text-muted-foreground">Your Name</label>
                    <Input
                      id="name"
                      placeholder="username here"
                      value={name}
                      onChange={(e) => {
                        setError('');
                        setName(e.target.value);
                      }}
                      className="h-10 text-sm bg-transparent text-white placeholder:text-white/60 border-b border-white/10 rounded-none px-1 py-2"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="code" className="text-xs font-medium text-muted-foreground">Access Code</label>
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
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCode(value);
                        setError('');
                      }}
                      className="h-10 text-sm text-center font-mono tracking-widest bg-transparent text-white placeholder:text-white/60 border-b border-white/10 rounded-none px-1 py-2"
                      maxLength={4}
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 bg-[hsl(var(--accent))] text-black hover:brightness-95" disabled={isLoading}>
                    {isLoading ? 'Loading...' : (isSignup ? 'Create Account' : 'Enter Arena')}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground w-full" type="button" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
                  {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
                </Button>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-3 gap-3 text-center mt-4">
              <div className="rounded-lg p-2 bg-transparent border border-[hsl(var(--primary))]">
                <p className="text-xl font-semibold text-[hsl(var(--primary))]">6</p>
                <p className="text-xs text-muted-foreground">Challenges</p>
              </div>
              <div className="rounded-lg p-2 bg-transparent border border-[hsl(var(--secondary))]">
                <p className="text-xl font-semibold text-[hsl(var(--secondary))]">Live</p>
                <p className="text-xs text-muted-foreground">Leaderboard</p>
              </div>
              <div className="rounded-lg p-2 bg-transparent border border-[hsl(var(--success))]">
                <p className="text-xl font-semibold text-[hsl(var(--success))]">∞</p>
                <p className="text-xs text-muted-foreground">Fun</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
