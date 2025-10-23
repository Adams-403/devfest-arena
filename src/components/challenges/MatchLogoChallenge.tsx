import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type CardItem = {
  id: number;
  key: string; // logo key/name used for matching
  src: string;
  flipped: boolean;
  matched: boolean;
};

// Available logos in the assets/match folder (kept in sync with the repo)
const LOGO_FILES = [
  'C.png',
  'Group-1.png',
  'androidstudio.png',
  'docker.png',
  'firebase.png',
  'flutter.png',
  'github.png',
  'python.png'
];

const makeLogoUrl = (name: string) => new URL(`../../../assets/match/${name}`, import.meta.url).href;

const shuffle = <T,>(arr: T[]) => {
  return arr
    .map((v) => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ v }) => v);
};

export const MatchLogoChallenge: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [matches, setMatches] = useState(0);
  const { currentPlayer, updateScore } = useGame();

  useEffect(() => {
    // initialize on mount
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initGame = () => {
    // build pair list (each logo twice) and shuffle
    const pairSources = LOGO_FILES.flatMap((name) => [name, name]);
    const shuffled = shuffle(pairSources);

    const initialCards: CardItem[] = shuffled.map((logoName, idx) => ({
      id: idx,
      key: logoName.replace(/\.[^.]+$/, ''),
      src: makeLogoUrl(logoName),
      flipped: false,
      matched: false
    }));

    setCards(initialCards);
    setFirst(null);
    setSecond(null);
    setIsBusy(false);
    setMatches(0);
  };

  const handleFlip = (index: number) => {
    if (isBusy) return;
    const card = cards[index];
    if (!card || card.flipped || card.matched) return;

    const updated = cards.map((c) => (c.id === index ? { ...c, flipped: true } : c));
    setCards(updated);

    if (first === null) {
      setFirst(index);
      return;
    }

    if (second === null) {
      setSecond(index);
      setIsBusy(true);

      // evaluate match after short delay so user can see second card
      setTimeout(() => {
        const firstCard = updated[first];
        const secondCard = updated[index];

        if (firstCard && secondCard && firstCard.key === secondCard.key) {
          // mark matched
          const newCards = updated.map((c) =>
            c.key === firstCard.key ? { ...c, matched: true, flipped: true } : c
          );
          setCards(newCards);
          setMatches((m) => m + 1);

          // award points
          // updateScore expects a single numeric argument (points to add)
          try {
            updateScore(10);
          } catch {
            /* ignore */
          }

          toast.success('Matched pair! +10 points');
        } else {
          // flip back
          const newCards = updated.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id ? { ...c, flipped: false } : c
          );
          setCards(newCards);
        }

        setFirst(null);
        setSecond(null);
        setIsBusy(false);
      }, 800);
    }
  };

  return (
    <Card className="border-2 border-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-accent" />
          Match Logos
        </CardTitle>
        <CardDescription>
          Flip and match identical logos. Each match awards 10 points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="bg-primary/10 rounded-lg p-4 flex-1 text-center">
            <p className="text-sm text-muted-foreground">Pairs Matched</p>
            <p className="text-2xl font-bold">{matches}/{LOGO_FILES.length}</p>
          </div>
          <div className="bg-card rounded-lg p-4 w-36 text-center">
            <p className="text-sm text-muted-foreground">Total Cards</p>
            <p className="text-2xl font-bold">{cards.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              disabled={card.flipped || card.matched || isBusy}
              className={`aspect-square bg-card rounded-lg border-2 border-border overflow-hidden flex items-center justify-center ${card.matched ? 'ring-2 ring-accent' : ''}`}
            >
              {card.flipped || card.matched ? (
                // reveal image
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={card.src} alt={`${card.key} logo`} className="max-h-3/4 max-w-3/4 object-contain" />
              ) : (
                <div className="text-muted-foreground">?
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={initGame} className="w-full" variant="outline">
            Restart
          </Button>
          <Button onClick={() => { setCards([]); initGame(); }} className="w-full">
            New Shuffle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchLogoChallenge;
