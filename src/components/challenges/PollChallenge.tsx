import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { CheckCircle2, Zap, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
    question: "How many people are currently playing this game?",
    options: ["1-10", "11-25", "26-50", "51-100", "100+"],
    votes: {},
    userVotes: []
  }
];

const QUESTION_TIME_MS = 75000; // 1 minute 15 seconds
const TRANSITION_TIME_MS = 20000; // 20 seconds

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
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTimeLeft, setTransitionTimeLeft] = useState(TRANSITION_TIME_MS);
  const { currentPlayer, updateScore, isAdmin, gameState } = useGame();
  const players = gameState.players || [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Start the game immediately when the current challenge is active
  useEffect(() => {
    if (gameState.currentChallenge?.id === '1' && !showResults && !isTransitioning) {
      startQuestionTimer();
    }
  }, [gameState.currentChallenge?.id, showResults, isTransitioning]);

  // Initialize votes and timer
  useEffect(() => {
    if (!gameState.currentChallenge?.active) return;
    
    const fetchVotes = async () => {
      const { data: votes, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', currentQuestion);

      if (error) {
        console.error('Error fetching votes:', error);
        return;
      }

      if (votes) {
        const voteCounts = votes.reduce((acc, vote) => {
          acc[vote.option_index] = (acc[vote.option_index] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        setPolls(prevPolls => {
          const newPolls = [...prevPolls];
          newPolls[currentQuestion] = {
            ...newPolls[currentQuestion],
            votes: voteCounts,
            userVotes: votes.map(vote => vote.user_id)
          };
          return newPolls;
        });
      }
    };

    fetchVotes();

    // Set up realtime subscription
    const subscription = supabase
      .channel('poll_votes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_votes',
        filter: `poll_id=eq.${currentQuestion}`
      }, (payload) => {
        fetchVotes();
      })
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      subscription.unsubscribe();
    };
  }, [currentQuestion]);

  const timerRef = useRef<NodeJS.Timeout>();
  const transitionTimerRef = useRef<NodeJS.Timeout>();

  const startQuestionTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIME_MS);
    setShowResults(false);
    setIsTransitioning(false);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const startTime = Date.now();
    const endTime = startTime + QUESTION_TIME_MS;
    
    const updateTimer = () => {
      const now = Date.now();
      const timeRemaining = endTime - now;
      
      if (timeRemaining <= 0) {
        setTimeLeft(0);
        handleShowResults();
        startTransitionTimer();
        return;
      }
      
      setTimeLeft(timeRemaining);
      timerRef.current = setTimeout(updateTimer, 100);
    };
    
    timerRef.current = setTimeout(updateTimer, 100);
  }, []);

  const startTransitionTimer = useCallback(() => {
    setTransitionTimeLeft(TRANSITION_TIME_MS);
    setIsTransitioning(true);
    
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    
    const startTime = Date.now();
    const endTime = startTime + TRANSITION_TIME_MS;
    
    const updateTransitionTimer = () => {
      const now = Date.now();
      const timeRemaining = endTime - now;
      
      if (timeRemaining <= 0) {
        setTransitionTimeLeft(0);
        moveToNextQuestion();
        return;
      }
      
      setTransitionTimeLeft(timeRemaining);
      transitionTimerRef.current = setTimeout(updateTransitionTimer, 100);
    };
    
    transitionTimerRef.current = setTimeout(updateTransitionTimer, 100);
  }, [currentQuestion]);

  const moveToNextQuestion = () => {
    if (currentQuestion < polls.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      startQuestionTimer();
    } else {
      setHasCompleted(true);
    }
  };

  const startGame = async () => {
    try {
      // Reset all votes and state when admin starts a new game
      if (isAdmin) {
        setCurrentQuestion(0);
        setShowResults(false);
        setHasCompleted(false);
        setPolls(POLL_QUESTIONS.map(q => ({
          ...q,
          votes: {},
          userVotes: []
        })));
        
        // Reset votes in the database
        const { error: deleteError } = await supabase
          .from('poll_votes')
          .delete()
          .neq('id', ''); // Add a condition to satisfy RLS
          
        if (deleteError) {
          console.error('Error resetting votes:', deleteError);
          toast.error('Failed to reset poll votes');
          return;
        }
      }
      
      // Reset local state
      setPolls(POLL_QUESTIONS.map(q => ({
        ...q,
        votes: q.options.reduce((acc, _, i) => ({ ...acc, [i]: 0 }), {}),
        userVotes: []
      })));
      
      setGameStarted(true);
      setCurrentQuestion(0);
      setShowResults(false);
      setHasCompleted(false);
      startQuestionTimer();
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game. Please try again.');
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!currentPlayer || showResults || !gameState.currentChallenge?.active || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Get the current user's vote for this poll
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('user_id', currentPlayer.id)
        .eq('poll_id', currentQuestion)
        .single();
      
      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('poll_votes')
          .update({ option_index: optionIndex })
          .eq('id', existingVote.id);
          
        if (error) throw error;
      } else {
        // Insert new vote
        const { error } = await supabase
          .from('poll_votes')
          .insert([
            {
              user_id: currentPlayer.id,
              poll_id: currentQuestion,
              option_index: optionIndex
            }
          ])
          .select();
          
        if (error) throw error;
      }
      
      // Update local state optimistically
      setPolls(prevPolls => {
        const newPolls = [...prevPolls];
        const currentPoll = { ...newPolls[currentQuestion] };
        
        // Reset previous vote if exists
        if (currentPoll.userVotes?.includes(currentPlayer.id)) {
          const prevVoteIndex = currentPoll.userVotes.indexOf(currentPlayer.id);
          if (prevVoteIndex !== -1) {
            const prevVote = currentPoll.userVotes[prevVoteIndex];
            if (prevVote !== undefined && currentPoll.votes[prevVote] > 0) {
              currentPoll.votes = { ...currentPoll.votes };
              currentPoll.votes[prevVote]--;
            }
          }
        }
        
        // Add new vote
        currentPoll.votes = {
          ...currentPoll.votes,
          [optionIndex]: (currentPoll.votes[optionIndex] || 0) + 1
        };
        
        // Update user votes
        currentPoll.userVotes = [
          ...(currentPoll.userVotes?.filter(id => id !== currentPlayer.id) || []),
          currentPlayer.id
        ];
        
        newPolls[currentQuestion] = currentPoll;
        return newPolls;
      });
      
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowResults = async () => {
    const currentPoll = polls[currentQuestion];
    if (!currentPoll) return;
    
    // Get all votes for this poll
    const { data: votes } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', currentQuestion);
    
    if (!votes) return;
    
    // Count votes per option
    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.option_index] = (acc[vote.option_index] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const voteEntries = Object.entries(voteCounts).map(([index, count]) => ({
      index: parseInt(index),
      count: count as number
    }));
    
    const maxVotes = Math.max(...voteEntries.map(v => v.count), 0);
    const winningOptions = voteEntries.filter(v => v.count === maxVotes).map(v => v.index);
    
    // Get all user IDs who voted for winning options
    const winningVotes = votes.filter(vote => winningOptions.includes(vote.option_index));
    const winningUserIds = new Set(winningVotes.map(vote => vote.user_id));
    
    // Special handling for the last question about player count
    if (currentQuestion === POLL_QUESTIONS.length - 1) {
      const playerCount = players.length;
      let correctRangeIndex = -1;
      
      // Determine which option is correct based on actual player count
      if (playerCount >= 1 && playerCount <= 10) correctRangeIndex = 0;
      else if (playerCount >= 11 && playerCount <= 25) correctRangeIndex = 1;
      else if (playerCount >= 26 && playerCount <= 50) correctRangeIndex = 2;
      else if (playerCount >= 51 && playerCount <= 100) correctRangeIndex = 3;
      else if (playerCount > 100) correctRangeIndex = 4;
      
      // Award points based on correct guess
      const correctVotes = votes.filter(vote => vote.option_index === correctRangeIndex);
      
      // Update scores in batch
      const updates = votes.map(vote => {
        const isCorrect = vote.option_index === correctRangeIndex;
        return {
          user_id: vote.user_id,
          points: isCorrect ? 10 : 0,
          isCorrect
        };
      });
      
      // Apply score updates
      for (const update of updates) {
        try {
          await updateScore(update.points);
          if (update.points > 0) {
            toast.success('🎉 Correct! +10 points', {
              description: `You guessed the right number of players (${playerCount})!`
            });
          } else {
            toast.info('Not quite right', {
              description: `There are actually ${playerCount} players. Better luck next time!`
            });
          }
        } catch (error) {
          console.error('Error updating score:', error);
        }
      }
    } else {
      // Regular question scoring - award 10 points to winners, 2 to participants
      const updates = votes.map(vote => {
        const isWinner = winningOptions.includes(vote.option_index);
        return {
          user_id: vote.user_id,
          points: isWinner ? 10 : 2,
          isWinner
        };
      });
      
      // Apply score updates
      for (const update of updates) {
        try {
          await updateScore(update.points);
          if (update.isWinner) {
            toast.success('🎉 You won! +10 points', {
              description: 'Your choice was in the majority!' 
            });
          } else {
            toast.info('+2 points for participating!', {
              description: 'Thanks for playing!' 
            });
          }
        } catch (error) {
          console.error('Error updating score:', error);
        }
      }
    }
    
    setShowResults(true);
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
  
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const timePercentage = (timeLeft / QUESTION_TIME_MS) * 100;
  const transitionPercentage = (transitionTimeLeft / TRANSITION_TIME_MS) * 100;

  // Show start screen for non-admin users when game is not active
  if (!gameState.currentChallenge?.active && !isAdmin) {
    return (
      <Card className="border-2 border-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Fire Poll Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#111] p-6 rounded-lg border border-gray-800 text-center">
            <h3 className="text-xl font-semibold mb-2 text-foreground">🎮 Get Ready!</h3>
            <p className="mb-4 text-foreground/90">The poll challenge will start soon. Be ready to vote!</p>
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Clock className="h-5 w-5" />
              <span>Waiting for admin to start the game...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  // Show completion message if user has completed all questions
  if (hasCompleted) {
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-secondary/20 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="font-mono">
                {isTransitioning ? formatTime(transitionTimeLeft) : formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground/90">Q{currentQuestion + 1}/{polls.length}</span>
            </div>
          </div>
        </div>
        <div className="pt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{isTransitioning ? 'Next question in' : 'Time remaining'}</span>
            <span>{isTransitioning ? 
              `${Math.ceil(transitionTimeLeft / 1000)}s` : 
              `${Math.ceil(timeLeft / 1000)}s`}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/20">
            <div 
              className={cn(
                'h-full transition-all duration-100 ease-linear',
                isTransitioning ? 'bg-blue-500' : 'bg-yellow-500'
              )}
              style={{
                width: `${isTransitioning ? 100 - transitionPercentage : timePercentage}%`
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 bg-[#0a0a0a] p-6">
        <div className="bg-secondary/10 rounded-lg p-6">
          <p className="text-xl font-semibold text-center">
            {currentPoll.question}
          </p>
        </div>

        {showResults || isTransitioning ? (
          <div className="space-y-6">
            <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
              <h3 className="text-lg font-semibold text-center mb-4">
                {isTransitioning ? 'Next Question Starting Soon' : 'Results'}
              </h3>
              
              {isTransitioning && (
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-yellow-400 mb-2">
                    {Math.ceil(transitionTimeLeft / 1000)}
                  </div>
                  <p className="text-muted-foreground">Next question starting in...</p>
                </div>
              )}
              
              <div className="space-y-4">
                {currentPoll.options.map((option, index) => {
                  const votes = currentPoll.votes?.[index] || 0;
                  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const isWinning = votes === Math.max(...Object.values(currentPoll.votes || {}));
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={cn("font-medium", isWinning && "text-green-400")}>
                          {option}
                          {isWinning && ' 🏆'}
                        </span>
                        <span className="text-muted-foreground">
                          {votes} vote{votes !== 1 ? 's' : ''} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3 bg-secondary/20 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isWinning ? 'bg-green-500' : 'bg-primary/80',
                            isTransitioning && 'opacity-70'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-secondary/20 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total votes: <span className="font-medium text-foreground">{totalVotes}</span>
                </div>
                {isLastQuestion && (
                  <div className="text-green-400 text-sm font-medium">
                    🎉 Challenge Complete!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLastQuestion && (
              <div className="bg-blue-900/20 border border-blue-700/50 p-3 rounded-lg flex items-start gap-3">
                <Users className="h-5 w-5 mt-0.5 text-blue-400 flex-shrink-0" />
                <div className="text-sm">
                  <h4 className="font-medium text-blue-200 mb-1">Special Question!</h4>
                  <p className="text-blue-300/90">
                    Guess how many people are currently playing this game. 
                    The closest guess wins <span className="font-bold text-yellow-300">10 points</span>!
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-3">
              {currentPoll.options.map((option, index) => {
                const isSelected = currentPlayer && currentPoll.userVotes?.includes(currentPlayer.id) && 
                  currentPoll.userVotes?.indexOf(currentPlayer.id) === index;
                
                return (
                  <Button
                    key={index}
                    onClick={() => handleVote(index)}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-14 text-lg justify-start transition-all",
                      isSelected ? "ring-2 ring-offset-2 ring-yellow-400/50" : "hover:bg-secondary/20"
                    )}
                    size="lg"
                    disabled={isTransitioning}
                  >
                    <span className="flex-1 text-left">{option}</span>
                    {isSelected && (
                      <CheckCircle2 className="ml-2 h-5 w-5 flex-shrink-0" />
                    )}
                  </Button>
                );
              })}
            </div>
            
            <div className="pt-2 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {hasVoted ? (
                  <span className="text-green-400">✓ Vote submitted</span>
                ) : (
                  <span>Select an option to vote</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
