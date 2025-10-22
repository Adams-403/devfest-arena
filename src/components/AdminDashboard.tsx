import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Settings, Play, StopCircle, Users } from 'lucide-react';

export const AdminDashboard = () => {
  const { gameState, startChallenge, endChallenge } = useGame();

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
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="font-semibold">Active Players</span>
            </div>
            <p className="text-3xl font-bold text-primary">{gameState.players.length}</p>
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
