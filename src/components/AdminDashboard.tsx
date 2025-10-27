import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Settings, Play, StopCircle, Users, User, Crown, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AdminDashboard = () => {
  const { 
    gameState, 
    activeChallenges, 
    startChallenge, 
    endChallenge, 
    endAllChallenges,
    allUsers, 
    fetchAllUsers, 
    isAdmin 
  } = useGame();

  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isEndingAll, setIsEndingAll] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin, fetchAllUsers]);

  const handleStartChallenge = async (challengeId: string) => {
    setIsLoading(prev => ({ ...prev, [challengeId]: true }));
    try {
      const success = await startChallenge(challengeId);
      if (success) {
        toast({
          title: 'Challenge Started',
          description: 'The challenge is now active!',
        });
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const handleEndChallenge = async (challengeId: string) => {
    setIsLoading(prev => ({ ...prev, [challengeId]: true }));
    try {
      const success = await endChallenge(challengeId);
      if (success) {
        toast({
          title: 'Challenge Ended',
          description: 'The challenge has been ended.',
        });
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const handleEndAllChallenges = async () => {
    if (!activeChallenges.length) return;
    
    setIsEndingAll(true);
    try {
      const success = await endAllChallenges();
      if (success) {
        toast({
          title: 'All Challenges Ended',
          description: 'All active challenges have been ended.',
        });
      }
    } finally {
      setIsEndingAll(false);
    }
  };

  const isChallengeActive = (challengeId: string) => {
    return activeChallenges.some(ac => ac.challenge_id === challengeId);
  };

  const getActiveChallenge = (challengeId: string) => {
    return activeChallenges.find(ac => ac.challenge_id === challengeId);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Admin Controls</CardTitle>
            </div>
            {activeChallenges.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleEndAllChallenges}
                disabled={isEndingAll}
              >
                {isEndingAll ? 'Ending...' : 'End All Challenges'}
              </Button>
            )}
          </div>
          <CardDescription>
            Manage challenges and monitor the game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold">All Users</span>
                  <span className="text-sm text-muted-foreground">({allUsers.length} total)</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAllUsers}
                  className="h-8"
                >
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {allUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.username}</span>
                      {user.is_admin && <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Score: <span className="font-medium text-foreground">{user.score}</span>
                      </span>
                      {user.access_code && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          Code: {user.access_code}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {allUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Challenge Controls</h3>
              <div className="text-sm text-muted-foreground">
                {activeChallenges.length} {activeChallenges.length === 1 ? 'challenge' : 'challenges'} active
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.challenges.map((challenge) => {
                const active = isChallengeActive(challenge.id);
                const activeChallenge = getActiveChallenge(challenge.id);
                
                return (
                  <div 
                    key={challenge.id} 
                    className={`border rounded-lg p-4 transition-all ${active ? 'border-green-500 bg-green-50/50' : 'hover:border-muted-foreground/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {challenge.title}
                          {active && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {active ? (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleEndChallenge(challenge.id)}
                            disabled={isLoading[challenge.id]}
                          >
                            {isLoading[challenge.id] ? 'Ending...' : 'End'}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleStartChallenge(challenge.id)}
                            disabled={isLoading[challenge.id]}
                          >
                            {isLoading[challenge.id] ? 'Starting...' : 'Start'}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {active && activeChallenge && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(activeChallenge.start_time).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Active for: {formatDurationActive(activeChallenge.start_time)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {activeChallenges.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <span className="font-medium">Note:</span> Users can now see and join any active challenges.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
