import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface VoteCount {
  [key: number]: number;
}

interface PollQuestion {
  question: string;
  options: string[];
  votes?: VoteCount;
  userVotes?: string[];
}

const POLL_QUESTIONS: PollQuestion[] = [
  {
    question: "Team Android or iPhone?",
    options: ["🤖 Android", "🍎 iPhone"],
    votes: {},
    userVotes: []
  },
  {
    question: "Which tech event is the most fun?",
    options: ["🎪 DevFest", "🌐 WWDC", "🔍 Google I/O", "🍎 WWDC"],
    votes: {},
    userVotes: []
  },
  {
    question: "Favorite coding snack?",
    options: ["🍕 Pizza", "☕ Coffee", "🍫 Chocolate", "🍪 Cookies"],
    votes: {},
    userVotes: []
  },
  {
    question: "Best programming language?",
    options: ["🐍 Python", "☕ Java", "🚀 JavaScript", "🦀 Rust"],
    votes: {},
    userVotes: []
  },
  {
    question: "Preferred way to debug?",
    options: ["🐞 console.log", "🔍 Debugger", "📜 Logs", "🤷‍♂️ Guess"],
    votes: {},
    userVotes: []
  }
];

export const PollChallenge = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [polls, setPolls] = useState<PollQuestion[]>(() => 
    POLL_QUESTIONS.map(q => ({
      ...q,
      votes: { ...q.votes },
      userVotes: [...(q.userVotes || [])]
    }))
  );
  const [showResults, setShowResults] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const { currentPlayer, updateScore, isAdmin } = useGame();

  // Initialize votes
  useEffect(() => {
    const initializedPolls = POLL_QUESTIONS.map(q => ({
      ...q,
      votes: q.options.reduce((acc, _, index) => ({ ...acc, [index]: 0 }), {}),
      userVotes: []
    }));
    setPolls(initializedPolls);
  }, []);

  // No automatic timer - admin controls the flow

  const handleVote = (optionIndex: number) => {
    if (!currentPlayer || showResults) return;
    
    setPolls(prevPolls => {
      const newPolls = [...prevPolls];
      const currentPoll = { ...newPolls[currentQuestion] };
      
      // Remove previous vote if exists
      if (currentPoll.userVotes?.includes(currentPlayer.id)) {
        const prevVoteIndex = currentPoll.userVotes.indexOf(currentPlayer.id);
        if (prevVoteIndex !== -1) {
          currentPoll.userVotes.splice(prevVoteIndex, 1);
          currentPoll.votes = { ...currentPoll.votes };
          const prevVote = currentPoll.userVotes[prevVoteIndex];
          if (prevVote !== undefined) {
            currentPoll.votes[prevVote] = (currentPoll.votes[prevVote] || 0) - 1;
          }
        }
      }
      
      // Add new vote
      currentPoll.votes = { ...currentPoll.votes };
      currentPoll.votes[optionIndex] = (currentPoll.votes[optionIndex] || 0) + 1;
      currentPoll.userVotes = [...(currentPoll.userVotes || []), currentPlayer.id];
      
      newPolls[currentQuestion] = currentPoll;
      
      // Check if this was the last question
      const isLastQuestion = currentQuestion === POLL_QUESTIONS.length - 1;
      
      // Move to next question if not the last one
      if (!isLastQuestion) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        // If it was the last question, mark as completed
        setHasCompleted(true);
      }
      
      return newPolls;
    });
  };

  const handleShowResults = () => {
    if (!isAdmin) return;
    
    const currentPoll = polls[currentQuestion];
    if (!currentPoll) return;
    
    const votes = Object.entries(currentPoll.votes || {}).map(([index, count]) => ({
      index: parseInt(index),
      count: count as number
    }));
    
    const maxVotes = Math.max(...votes.map(v => v.count), 0);
    const minVotes = Math.min(...votes.map(v => v.count === 0 ? Infinity : v.count), 0);
    const winningOptions = votes.filter(v => v.count === maxVotes).map(v => v.index);
    const losingOptions = votes.filter(v => v.count === minVotes).map(v => v.index);
    
    // Show appropriate message based on user's vote
    if (currentPlayer) {
      const userVote = currentPoll.userVotes?.includes(currentPlayer.id) ? 
        currentPoll.userVotes.indexOf(currentPlayer.id) : -1;
      
      if (userVote !== -1) {
        if (winningOptions.includes(userVote)) {
          // Award 5 points for most popular choice (2 participation + 3 bonus)
          toast.success('🎉 You got it right! +5 points', {
            description: `Your choice (${currentPoll.options[userVote]}) was the most popular! (2 participation + 3 bonus)`
          });
        } else if (losingOptions.includes(userVote)) {
          toast.info('You chose the least popular option', {
            description: 'No points this time, but thanks for participating!'
          });
        } else {
          // Award 2 points for participation
          toast.info('+2 points for participating!', {
            description: 'Your choice was not the most popular, but you still get 2 points for participating!'
          });
        }
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < polls.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowResults(false);
    }
  };

  const currentPoll = polls[currentQuestion];
  if (!currentPoll) return null;

  const totalVotes = Object.values(currentPoll.votes || {}).reduce((sum, count) => sum + count, 0);
  const hasVoted = currentPlayer && currentPoll.userVotes?.includes(currentPlayer.id);
  const isLastQuestion = currentQuestion === polls.length - 1;

  // Show completion message if user has completed all questions
  if (hasCompleted && !isAdmin) {
    return (
      <Card className="border-2 border-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Poll Challenge Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#111] p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-foreground">🎉 Great job!</h3>
            <p className="mb-4 text-foreground/90">You've completed all the polls! Here's how scoring works:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-foreground/90"><strong>+5 points total</strong> if your choice was the most popular (2 participation + 3 bonus)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">✓</span>
                <span className="text-foreground/90"><strong>+2 points</strong> for participating in each poll</span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            The admin will release the results soon. Your points will be updated automatically!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-secondary bg-[#0a0a0a]">
      <CardHeader className="bg-[#0a0a0a] rounded-t-lg">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Fire Poll Challenge
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {!showResults && (
              <span className="text-foreground/90">Question {currentQuestion + 1}/{polls.length}</span>
            )}
          </div>
        </div>
        <CardDescription>
          Question {currentQuestion + 1} of {polls.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 bg-[#0a0a0a] p-6">
        <div className="bg-secondary/10 rounded-lg p-6">
          <p className="text-xl font-semibold text-center">
            {currentPoll.question}
          </p>
        </div>

        {showResults ? (
          <div className="space-y-4">
            {currentPoll.options.map((option, index) => {
              const votes = currentPoll.votes?.[index] || 0;
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isWinning = votes === Math.max(...Object.values(currentPoll.votes || {}));
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{option}</span>
                    <span className="text-muted-foreground">
                      {votes} vote{votes !== 1 ? 's' : ''} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-4 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isWinning ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            
            <div className="pt-4 flex justify-between">
              {isAdmin && !isLastQuestion && (
                <Button onClick={handleNextQuestion} variant="outline">
                  Next Question
                </Button>
              )}
              {isAdmin && isLastQuestion && (
                <Button onClick={handleNextQuestion} disabled>
                  Challenge Complete!
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                Total votes: {totalVotes}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {currentPoll.options.map((option, index) => {
              const isSelected = currentPlayer && currentPoll.userVotes?.includes(currentPlayer.id) && 
                currentPoll.votes?.[index] > (currentPoll.userVotes?.includes(currentPlayer.id) ? 0 : -1);
              
              return (
                <Button
                  key={index}
                  onClick={() => handleVote(index)}
                  variant={isSelected ? "default" : "outline"}
                  className="h-14 text-lg justify-start"
                  size="lg"
                >
                  {option}
                  {isSelected && (
                    <CheckCircle2 className="ml-2 h-5 w-5" />
                  )}
                </Button>
              );
            })}
            
            {isAdmin && (
              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleShowResults}
                  variant="secondary"
                  disabled={!hasVoted}
                >
                  Show Results
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
