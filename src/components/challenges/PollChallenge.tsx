import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const POLL_QUESTIONS = [
  {
    question: "Team Android or iPhone?",
    options: ["Android", "iPhone"],
    correctAnswer: 0
  },
  {
    question: "Which framework would you trust your life with?",
    options: ["React", "Flutter", "Vue", "Angular"],
    correctAnswer: 0
  },
  {
    question: "Backend of choice?",
    options: ["Node.js", "Python", "Go", "Java"],
    correctAnswer: 0
  }
];

export const PollChallenge = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answered, setAnswered] = useState(false);
  const { currentPlayer, updateScore } = useGame();

  const handleAnswer = (optionIndex: number) => {
    if (answered) return;

    const question = POLL_QUESTIONS[currentQuestion];
    const isCorrect = optionIndex === question.correctAnswer;
    
    if (isCorrect && currentPlayer) {
      updateScore(currentPlayer.id, 5);
      toast.success('Correct! +5 points', {
        icon: '🎯'
      });
    } else {
      toast.error('Not quite!', {
        icon: '💭'
      });
    }

    setAnswered(true);

    setTimeout(() => {
      if (currentQuestion < POLL_QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setAnswered(false);
      }
    }, 2000);
  };

  const question = POLL_QUESTIONS[currentQuestion];

  return (
    <Card className="border-2 border-secondary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-secondary" />
          Rapid Fire Polls
        </CardTitle>
        <CardDescription>
          Question {currentQuestion + 1} of {POLL_QUESTIONS.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-secondary/10 rounded-lg p-6">
          <p className="text-xl font-semibold text-center">
            {question.question}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              variant={answered && index === question.correctAnswer ? "default" : "outline"}
              className="h-14 text-lg"
              size="lg"
            >
              {option}
            </Button>
          ))}
        </div>

        {answered && (
          <p className="text-center text-sm text-muted-foreground animate-in fade-in">
            Moving to next question...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
