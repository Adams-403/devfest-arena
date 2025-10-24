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
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finalPoints, setFinalPoints] = useState<number | null>(null);
  const { currentPlayer, updateScore } = useGame();

  const TARGET_TIME_SEC = 60; // target time for full bonus

  useEffect(() => {
    // initialize on mount
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    if (started && !finished && startTime) {
      timer = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [started, startTime, finished]);

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
    setStarted(false);
    setStartTime(null);
    setElapsedMs(0);
    setFinished(false);
    setFinalPoints(null);
  };

  const handleFlip = (index: number) => {
    if (isBusy) return;
    const card = cards[index];
    if (!card || card.flipped || card.matched) return;

    // start timer on first flip
    if (!started) {
      setStarted(true);
      setStartTime(Date.now());
    }

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
          const newMatches = matches + 1;
          setMatches(newMatches);

          toast.success('Matched pair!');

          // if all matched, finish
          if (newMatches === LOGO_FILES.length) {
            // finalize
            finishGame();
          }
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

  const calculateTimeBonus = (timeMs: number): number => {
    if (timeMs < 20000) return 5;   // Under 20 seconds
    if (timeMs < 30000) return 3;   // Under 30 seconds
    if (timeMs < 50000) return 2;   // Under 50 seconds
    return 0;                       // 50+ seconds
  };

  const finishGame = () => {
    if (!startTime) return;
    const totalMs = Date.now() - startTime;
    setElapsedMs(totalMs);
    setFinished(true);

    // Base points: 1.25 points per match (8 matches = 10 points total)
    const basePoints = 10;
    
    // Calculate time bonus
    const timeBonus = calculateTimeBonus(totalMs);
    const totalAward = basePoints + timeBonus;
    
    setFinalPoints(totalAward);

    // Award all points at the end
    try {
      updateScore(totalAward);
      
      // Show toast with bonus info if any
      if (timeBonus > 0) {
        toast.success(`Time bonus! +${timeBonus} points for finishing in ${(totalMs/1000).toFixed(1)}s`);
      } else {
        toast.success(`Completed! ${basePoints} points earned`);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    // cap the card width on large screens so the 4x4 grid doesn't become too large
    <Card className="border-2 border-accent w-full max-w-full mx-auto max-w-[980px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-accent" />
          Match Logos
        </CardTitle>
        <CardDescription>
          Flip and match identical logos. Complete all matches to earn points!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between w-full">
          <div className="rounded-lg p-2 w-28 text-center border-2 border-amber-500 flex-shrink-0 bg-transparent">
            <p className="text-xs text-muted-foreground">Pairs Matched</p>
            <p className="text-lg font-bold">{matches}/{LOGO_FILES.length}</p>
          </div>

          <div className="flex-1" />

          <div className="rounded-lg p-2 w-28 text-center flex-shrink-0 border-2 border-emerald-500 bg-transparent">
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="text-lg font-bold">{(elapsedMs / 1000).toFixed(1)}s</p>
          </div>
        </div>

        <div className="w-full max-w-full mx-auto" style={{ maxWidth: 'min(720px, 100%)' }}>
          <div className="grid grid-cols-4 gap-3" style={{ gridAutoRows: '1fr' }}>
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
                <img src={card.src} alt={`${card.key} logo`} className="w-3/4 h-3/4 object-contain" />
              ) : (
                <div className="text-muted-foreground">?
                </div>
              )}
            </button>
          ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={initGame} className="w-full" variant="outline">
            Restart
          </Button>
          <Button onClick={() => { setCards([]); initGame(); }} className="w-full">
            New Shuffle
          </Button>
        </div>

        {finished && finalPoints !== null && (
          <div className="mt-4 p-4 bg-muted/20 rounded-lg">
            <p className="font-semibold text-lg">Challenge Complete!</p>
            <p className="text-sm text-muted-foreground">Time: <span className="font-medium">{(elapsedMs/1000).toFixed(2)}s</span></p>
            <p className="text-sm text-muted-foreground">Points awarded this round: <span className="font-medium">{finalPoints}</span></p>
            <div className="space-y-2 mt-3">
              <div className="text-sm bg-muted/50 p-3 rounded-md">
                <p className="font-medium">Score Breakdown:</p>
                <div className="flex justify-between">
                  <span>Base Score (8 matches × 1.25 points):</span>
                  <span className="font-mono">10 points</span>
                </div>
                {finalPoints > 10 && (
                  <div className="flex justify-between text-green-500">
                    <span>Time Bonus:</span>
                    <span className="font-mono">+{finalPoints - 10} points</span>
                  </div>
                )}
                <div className="flex justify-between font-bold mt-1 pt-1 border-t border-border">
                  <span>Total:</span>
                  <span className="font-mono">{finalPoints} points</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const timeStr = (elapsedMs/1000).toFixed(1);
                  const text = `🏆 I matched all ${LOGO_FILES.length} logos in ${timeStr}s and scored ${finalPoints} points! Can you beat my time? #DevFestArena`;
                  if (navigator.share) {
                    navigator.share({ 
                      title: 'Match Logo Challenge',
                      text: text,
                      url: window.location.href
                    }).catch(() => navigator.clipboard.writeText(text));
                  } else {
                    navigator.clipboard.writeText(text);
                    toast.success('Result copied to clipboard!');
                  }
                }} className="w-full">
                  Share Result
                </Button>
                <Button 
                  onClick={() => { 
                    setFinished(false); 
                    setFinalPoints(null); 
                    initGame(); 
                  }} 
                  variant="outline" 
                  className="w-full"
                >
                  Play Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchLogoChallenge;
