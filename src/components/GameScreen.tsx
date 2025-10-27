import { useGame } from '@/contexts/GameContext';
import HeaderLogo from '@/../public/assets/0216-GfD-DevFest-Toolkit-Stickers-03.png';
import { Leaderboard } from './Leaderboard';
import ShakeChallenge from './challenges/ShakeChallenge';
import { PollChallenge } from './challenges/PollChallenge';
import { LuckyTapChallenge } from './challenges/LuckyTapChallenge';
import { EmojiChallenge } from './challenges/EmojiChallenge';
import MatchLogoChallenge from './challenges/MatchLogoChallenge';
import { AdminDashboard } from './AdminDashboard';
import { Button } from './ui/button';
import { Share2, LogOut, Crown, User, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

// Challenge component map for dynamic rendering
const challengeComponents = {
  'shake': ShakeChallenge,
  'poll': PollChallenge,
  'lucky-tap': LuckyTapChallenge,
  'emoji': EmojiChallenge,
  'match-logos': MatchLogoChallenge,
};

export const GameScreen = () => {
  const { gameState, currentPlayer, isAdmin, setIsAdmin } = useGame();

  const handleShare = () => {
    const text = `I'm playing DevFest Arena Gombe 2025! 🚀\nMy score: ${currentPlayer?.score} points\nPlay now at df25.gdggombe.com\n#DevFestGombe #DevFestArena`;
    
    if (navigator.share) {
      navigator.share({ 
        text,
        url: 'https://df25.gdggombe.com'
      });
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

  const navigate = useNavigate();
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  // Get border color based on challenge ID
  const getBorderColor = (id: string) => {
    const colors = [
      'border-red-500',  // Google Red
      'border-blue-500', // Google Blue
      'border-green-500', // Google Green
      'border-yellow-500', // Google Yellow
    ];
    const index = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Format duration active for challenges with more precision
  const formatDurationActive = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsedMs = now.getTime() - start.getTime();
    
    const seconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'}, ${hours % 24} hour${hours % 24 === 1 ? '' : 's'}`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}, ${minutes % 60} minute${minutes % 60 === 1 ? '' : 's'}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}, ${seconds % 60} second${seconds % 60 === 1 ? '' : 's'}`;
    } else {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
  };

  // Get the challenge type from the challenge ID
  const getChallengeType = (challengeId: string) => {
    const challenge = gameState.challenges.find(c => c.id === challengeId);
    return challenge?.type || '';
  };

  // Get the challenge title from the challenge ID
  const getChallengeTitle = (challengeId: string) => {
    const challenge = gameState.challenges.find(c => c.id === challengeId);
    return challenge?.title || 'Unknown Challenge';
  };

  const renderChallenge = () => {
    // If a challenge is selected, render it
    if (selectedChallenge) {
      const challengeType = getChallengeType(selectedChallenge);
      const ChallengeComponent = challengeComponents[challengeType as keyof typeof challengeComponents];
      
      if (!ChallengeComponent) {
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-bold mb-2">Challenge Not Found</h2>
            <p className="text-muted-foreground mb-4">The selected challenge could not be loaded.</p>
            <Button onClick={() => setSelectedChallenge(null)}>Back to Challenges</Button>
          </div>
        );
      }

      return (
        <div>
          <div className="mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedChallenge(null)}
              className="mb-4"
            >
              ← Back to all challenges
            </Button>
          </div>
          <ChallengeComponent />
        </div>
      );
    }

    // If no challenge is selected, show the list of active challenges
    const { activeChallenges } = useGame();

    if (activeChallenges.length === 0) {
      return (
        <div className="text-center p-12 bg-muted/50 rounded-lg">
          <p className="text-xl text-muted-foreground">
            {isAdmin ? (
              <span className="animate-pulse">Start a challenge from the admin panel</span>
            ) : (
              <span className="flex flex-col items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-full bg-yellow-400 animate-pulse"></span>
                <span>No active challenges at the moment. Check back later!</span>
              </span>
            )}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Active Challenges</h2>
          <p className="text-muted-foreground">
            Choose a challenge to participate in
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeChallenges.map((activeChallenge) => {
            const challenge = gameState.challenges.find(c => c.id === activeChallenge.challenge_id);
            if (!challenge) return null;
            
            return (
              <Card key={activeChallenge.id} className={`hover:shadow-md transition-shadow border-2 ${getBorderColor(activeChallenge.challenge_id)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {challenge.title}
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Started: {new Date(activeChallenge.start_time).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">
                      Active for: {formatDurationActive(activeChallenge.start_time)}
                    </p>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => setSelectedChallenge(challenge.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Add state to track the current view mode, defaulting to the value from localStorage or isAdmin
  const [isAdminView, setIsAdminView] = useState(() => {
    // Check localStorage first, then fall back to isAdmin
    if (typeof window === 'undefined') return false;
    const savedView = localStorage.getItem('adminView');
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

  // Show game status indicator
  const renderGameStatus = () => {
    if (gameState.gameStarted) {
      return (
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
          <span className="sr-only">Game in progress</span>
        </div>
      );
    }
    return (
      <div className="flex items-center">
        <span className="h-3 w-3 rounded-full bg-yellow-400" aria-hidden="true" />
        <span className="sr-only">Waiting to start</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/50">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="py-2 h-14 sm:h-16 md:h-16 lg:h-16 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {renderGameStatus()}
            </div>
            <div className="flex items-center gap-2">
              <img
                src={HeaderLogo}
                alt="DevFest Arena Logo"
                className="w-48 sm:w-48 md:w-56 lg:w-64 xl:w-72 max-h-full h-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              {currentPlayer && (
                <p className="hidden md:block text-sm text-muted-foreground">
                  Welcome, <span className="font-medium text-foreground">{currentPlayer.name}</span> • Score: <span className="font-bold text-primary">{currentPlayer.score}</span>
                </p>
              )}
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
                  <div className="relative group">
                    <Button 
                      onClick={handleShare} 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 hidden sm:flex"
                      aria-label="Share"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={handleShare} 
                            variant="outline" 
                            size="icon"
                            className="h-9 w-9 sm:hidden"
                            aria-label="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Share</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isAdminView ? <AdminDashboard /> : renderChallenge()}
          </div>
          <div className="space-y-6">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
};
