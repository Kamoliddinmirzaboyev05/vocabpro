import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import * as api from "../utils/api";
import { PageSkeleton } from "./PageSkeleton";

export function Quiz() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answeredWords, setAnsweredWords] = useState<{ word: any; correct: boolean }[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [mistakeCounts, setMistakeCounts] = useState<Record<string, number>>({});
  const [reviewWords, setReviewWords] = useState<any[]>([]);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      if (collectionId) {
        const data = await api.getCollection(collectionId);
        setCollection(data);
      }
    } catch (error) {
      console.error("Failed to load collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const words = collection?.words || [];
  const activeWords = currentRound <= 5 ? words : reviewWords;
  const currentWord = activeWords?.[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (activeWords?.length || 1)) * 100;

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const options = useMemo(() => {
    const correct = currentWord?.translation;
    if (!correct) return [];
    const candidates = words
      .filter((_: any, idx: number) => idx !== currentQuestionIndex)
      .map((w: any) => w.translation)
      .filter((t: string | undefined) => !!t && t !== correct);
    const wrongs = shuffleArray(candidates).slice(0, 3);
    return shuffleArray([correct, ...wrongs]);
  }, [words, currentQuestionIndex, currentWord]);

  useEffect(() => {
    if (timeLeft > 0 && !showFeedback) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showFeedback) {
      handleAnswer(null);
    }
  }, [timeLeft, showFeedback]);

  useEffect(() => {
    if (words?.length) {
      console.log("Current active word:", words[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, collection]);

  const handleAnswer = (answer: string | null) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const correctTarget = currentWord?.correctAnswer ?? currentWord?.translation;
    const isCorrect = answer === correctTarget;
    if (isCorrect) {
      setScore(score + 100);
    }

    if (currentWord) {
      setAnsweredWords([
        ...answeredWords,
        { word: currentWord, correct: isCorrect },
      ]);
      if (!isCorrect && currentWord.id) {
        setMistakeCounts((prev) => ({
          ...prev,
          [currentWord.id]: (prev[currentWord.id] || 0) + 1,
        }));
      }
    }

    setTimeout(() => {
      const setLength = activeWords?.length || 0;
      if (currentQuestionIndex < setLength - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setTimeLeft(15);
      } else {
        if (currentRound < 5) {
          setCurrentRound(currentRound + 1);
          setCurrentQuestionIndex(0);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setTimeLeft(15);
        } else if (currentRound === 5) {
          const sortedIds = Object.entries(mistakeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);
          const selected = words.filter((w: any) => sortedIds.includes(w.id));
          setReviewWords(selected);
          if (selected.length === 0) {
            navigate("/summary", {
              state: {
                score,
                total: collection?.words.length || 0,
                answeredWords,
                collectionName: collection?.name,
              },
            });
            return;
          }
          setCurrentRound(6);
          setCurrentQuestionIndex(0);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setTimeLeft(15);
        } else if (currentRound === 6) {
          setCurrentRound(7);
          setCurrentQuestionIndex(0);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setTimeLeft(15);
        } else {
          navigate("/summary", {
            state: {
              score,
              total: collection?.words.length || 0,
              answeredWords,
              collectionName: collection?.name,
            },
          });
        }
      }
    }, 1500);
  };

  if (loading) {
    return <PageSkeleton variant="quiz" />;
  }

  if (!collection?.words) {
    return <PageSkeleton variant="quiz" />;
  }

  if (collection.words.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">No words found</p>
          <Button onClick={() => navigate("/dashboard")} className="bg-emerald hover:bg-emerald-dark">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!collection || !currentWord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Collection not found</p>
          <Button onClick={() => navigate("/dashboard")} className="bg-emerald hover:bg-emerald-dark">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
              <p className="text-muted-foreground">
                {currentRound <= 5
                  ? `Round ${currentRound}/5 • Question ${currentQuestionIndex + 1} of ${activeWords.length}`
                  : `Final: Mastery Round • Question ${currentQuestionIndex + 1} of ${activeWords.length}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald">{score}</div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" />
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="relative w-24 h-24"
            animate={{ scale: timeLeft <= 5 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
          >
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - timeLeft / 15)}`}
                className={timeLeft <= 5 ? "text-destructive" : "text-emerald"}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-foreground" />
                <div className="text-xl font-bold text-foreground">{timeLeft}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-card border-border p-8 mb-6">
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Translate this word:</p>
              <h2 className="text-4xl font-bold text-foreground">{currentWord?.word ?? currentWord?.english}</h2>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options?.map((option: string, index: number) => {
                const isSelected = selectedAnswer === option;
                const correctTarget = currentWord?.correctAnswer ?? currentWord?.translation;
                const isCorrect = option === correctTarget;
                const showCorrect = showFeedback && isCorrect;
                const showIncorrect = showFeedback && isSelected && !isCorrect;

                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                    whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                  >
                    <Button
                      onClick={() => !showFeedback && handleAnswer(option)}
                      disabled={showFeedback}
                      className={`w-full h-16 text-lg transition-all duration-300 ${
                        showCorrect
                          ? "bg-emerald hover:bg-emerald text-white"
                          : showIncorrect
                          ? "bg-destructive hover:bg-destructive text-white"
                          : "bg-secondary hover:bg-navy text-foreground hover:text-white"
                      }`}
                    >
                      {option}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Feedback */}
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p
              className={`text-xl font-semibold ${
                selectedAnswer === (currentWord?.correctAnswer ?? currentWord?.translation)
                  ? "text-emerald"
                  : "text-destructive"
              }`}
            >
              {selectedAnswer === (currentWord?.correctAnswer ?? currentWord?.translation)
                ? "Correct! +100 points"
                : `Incorrect. The answer was: ${currentWord?.correctAnswer ?? currentWord?.translation}`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
