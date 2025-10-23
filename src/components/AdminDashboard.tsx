import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Settings, Play, StopCircle, Users, User, Crown } from 'lucide-react';
import { useEffect } from 'react';

export const AdminDashboard = () => {
  const { gameState, startChallenge, endChallenge, allUsers, fetchAllUsers, isAdmin } = useGame();

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin, fetchAllUsers]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Controls
          </CardTitle>
          <CardDescription>
            Manage challenges and monitor the game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-2">
            <h3 className="font-semibold">Challenge Controls</h3>
            {gameState.challenges.map((challenge) => (
              <div key={challenge.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{challenge.title}</p>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                {gameState.currentChallenge?.id === challenge.id ? (
                  <Button onClick={endChallenge} variant="destructive" size="sm">
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                ) : (
                  <Button onClick={() => startChallenge(challenge.id)} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
