import { useGame } from '@/contexts/GameContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { GameScreen } from '@/components/GameScreen';

const Index = () => {
  const { currentPlayer, isAdmin } = useGame();

  if (!currentPlayer && !isAdmin) {
    return <WelcomeScreen />;
  }

  return <GameScreen />;
};

export default Index;
