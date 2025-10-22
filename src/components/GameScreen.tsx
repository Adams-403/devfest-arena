import { useGame } from '@/contexts/GameContext';
import { Leaderboard } from './Leaderboard';
import { ShakeChallenge } from './challenges/ShakeChallenge';
import { PollChallenge } from './challenges/PollChallenge';
import { LuckyTapChallenge } from './challenges/LuckyTapChallenge';
import { EmojiChallenge } from './challenges/EmojiChallenge';
import { AdminDashboard } from './AdminDashboard';
import { Button } from './ui/button';
import { Share2, LogOut, Crown } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleLogout = () => {
    localStorage.removeItem('devfest-current-player');
    localStorage.removeItem('devfest-is-admin');
    window.location.reload();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {isAdmin && <Crown className="h-6 w-6 text-accent" />}
                DevFest Arena
              </h1>
              {currentPlayer && (
                <p className="text-sm text-muted-foreground">
                  Welcome, {currentPlayer.name}! Score: {currentPlayer.score}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!isAdmin && (
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              {isAdmin && (
                <Button onClick={() => setIsAdmin(false)} variant="outline" size="sm">
                  Player View
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
            {isAdmin ? <AdminDashboard /> : renderChallenge()}
          </div>
          <div>
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
};
