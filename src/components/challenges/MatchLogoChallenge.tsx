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
          setMatches((m) => m + 1);

          // award points
          // updateScore expects a single numeric argument (points to add)
          try {
            updateScore(10);
          } catch {
            /* ignore */
          }

          toast.success('Matched pair! +10 points');

          // if all matched, finish
          if (matches + 1 === LOGO_FILES.length) {
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

  const finishGame = () => {
    if (!startTime) return;
    const totalMs = Date.now() - startTime;
    setElapsedMs(totalMs);
    setFinished(true);

    // Base points are matches * 10 (we already awarded per match via updateScore)
    const basePoints = LOGO_FILES.length * 10;

    // Time bonus: faster than TARGET_TIME_SEC gets bonus up to +50% of basePoints
    const targetMs = TARGET_TIME_SEC * 1000;
    let bonus = 0;
    if (totalMs <= targetMs) {
      // linear bonus: if completed instantly (approaching 0ms) get +50% of base
      const ratio = 1 - totalMs / targetMs; // 0..1
      bonus = Math.round(basePoints * 0.5 * ratio);
    } else {
      // penalty: lose up to 50% of basePoints proportionally (capped)
      const over = Math.min(totalMs - targetMs, targetMs); // cap penalty to targetMs
      const ratio = over / targetMs; // 0..1
      bonus = -Math.round(basePoints * 0.5 * ratio);
    }

    const totalAward = basePoints + bonus;
    setFinalPoints(totalAward);

    // Apply the time-based bonus/penalty to the player's score
    try {
      if (totalAward !== 0) updateScore(totalAward);
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
          Flip and match identical logos. Each match awards 10 points.
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
            <div className="flex gap-2 mt-3">
              <Button onClick={() => {
                const text = `I just completed Match Logos in ${(elapsedMs/1000).toFixed(2)}s and earned ${finalPoints} points on DevFest Arena! #DevFestArena`;
                if (navigator.share) {
                  navigator.share({ text }).catch(() => navigator.clipboard.writeText(text));
                } else {
                  navigator.clipboard.writeText(text);
                  toast.success('Result copied to clipboard!');
                }
              }} className="w-full">
                Share Result
              </Button>
              <Button onClick={() => { setFinished(false); setFinalPoints(null); initGame(); }} variant="outline" className="w-full">
                Play Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchLogoChallenge;
