import { useGame } from '@/contexts/GameContext';
import { Leaderboard } from './Leaderboard';
import { ShakeChallenge } from './challenges/ShakeChallenge';
import { PollChallenge } from './challenges/PollChallenge';
import { LuckyTapChallenge } from './challenges/LuckyTapChallenge';
import { EmojiChallenge } from './challenges/EmojiChallenge';
import { AdminDashboard } from './AdminDashboard';
import { Button } from './ui/button';
import { Share2, LogOut, Crown, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const GameScreen = () => {
  const { gameState, currentPlayer, isAdmin, setIsAdmin } = useGame();

  const handleShare = () => {
    const text = `I'm playing DevFest Arena Gombe 2025! 🚀\nMy score: ${currentPlayer?.score} points\n#DevFestGombe #DevFestArena`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Share text copied to clipboard!');
    }
  };

  const { logout } = useGame();

  const handleLogout = async () => {
    try {
      await logout();
      // The page will be automatically refreshed by the auth state change listener
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderChallenge = () => {
    if (!gameState.currentChallenge) {
      return (
        <div className="text-center p-12 bg-muted/50 rounded-lg">
          <p className="text-xl text-muted-foreground">
            {isAdmin ? 'Start a challenge from the admin panel' : 'Waiting for the next challenge...'}
          </p>
        </div>
      );
    }

    switch (gameState.currentChallenge.type) {
      case 'shake':
        return <ShakeChallenge />;
      case 'poll':
        return <PollChallenge />;
      case 'lucky-tap':
        return <LuckyTapChallenge />;
      case 'emoji':
        return <EmojiChallenge />;
      default:
        return null;
    }
  };

  // Add state to track the current view mode, defaulting to the value from localStorage or isAdmin
  const [isAdminView, setIsAdminView] = useState(() => {
    // Check localStorage first, then fall back to isAdmin
    const savedView = typeof window !== 'undefined' ? localStorage.getItem('adminView') : null;
    return savedView !== null ? savedView === 'true' : isAdmin;
  });

  // Update localStorage and state when the view changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminView', String(isAdminView));
    }
  }, [isAdminView]);

  // Update the view when isAdmin changes (e.g., after login/logout)
  useEffect(() => {
    if (isAdmin) {
      // Only update if we're an admin, otherwise force to player view
      const savedView = typeof window !== 'undefined' ? localStorage.getItem('adminView') : null;
      setIsAdminView(savedView !== null ? savedView === 'true' : true);
    } else {
      // Non-admin users should always be in player view
      setIsAdminView(false);
    }
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  DevFest Arena
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">
                      {isAdminView ? 'Admin Mode' : 'Player Mode'}
                    </span>
                  </div>
                )}
              </div>
              {currentPlayer && (
                <p className="text-sm text-muted-foreground">
                  Welcome, <span className="font-medium text-foreground">{currentPlayer.name}</span> • Score: <span className="font-bold text-primary">{currentPlayer.score}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <div className="relative group">
                  <Button 
                    onClick={() => setIsAdminView(!isAdminView)} 
                    variant="outline" 
                    size="sm"
                    className="gap-2 hidden sm:flex"
                    aria-label={isAdminView ? 'Switch to Player View' : 'Admin Dashboard'}
                  >
                    {isAdminView ? (
                      <>
                        <User className="h-4 w-4" />
                        Player View
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Admin Dashboard
                      </>
                    )}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => setIsAdminView(!isAdminView)} 
                          variant="outline" 
                          size="icon"
                          className="h-9 w-9 sm:hidden"
                          aria-label={isAdminView ? 'Switch to Player View' : 'Admin Dashboard'}
                        >
                          {isAdminView ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Crown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{isAdminView ? 'Player View' : 'Admin Dashboard'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              {!isAdminView && (
                <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
              
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isAdminView ? <AdminDashboard /> : renderChallenge()}
          </div>
          <div>
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
};
