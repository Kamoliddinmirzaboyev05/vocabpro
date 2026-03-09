import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import type { Word } from "../data/mockData";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import * as api from "../utils/api";
import { mockCollections } from "../data/mockData";

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
  const [answeredWords, setAnsweredWords] = useState<{
    word: Word;
    correct: boolean;
  }[]>([]);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      if (collectionId) {
        try {
          const data = await api.getCollection(collectionId);
          setCollection(data);
        } catch (apiError) {
          // Fallback to mock data if backend is unavailable
          console.log("Backend unavailable, using mock data");
          const mockData = mockCollections.find((c) => c.id === collectionId);
          if (mockData) {
            setCollection(mockData);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentWord = collection?.words[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (collection?.words.length || 1)) * 100;

  useEffect(() => {
    if (timeLeft > 0 && !showFeedback) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showFeedback) {
      handleAnswer(null);
    }
  }, [timeLeft, showFeedback]);

  const handleAnswer = (answer: string | null) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const isCorrect = answer === currentWord?.correctAnswer;
    if (isCorrect) {
      setScore(score + 100);
    }

    if (currentWord) {
      setAnsweredWords([
        ...answeredWords,
        { word: currentWord, correct: isCorrect },
      ]);
    }

    setTimeout(() => {
      if (currentQuestionIndex < (collection?.words.length || 0) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setTimeLeft(15);
      } else {
        // Quiz complete - navigate to summary
        navigate("/summary", {
          state: {
            score,
            total: collection?.words.length || 0,
            answeredWords,
            collectionName: collection?.name,
          },
        });
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading quiz...</p>
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
                Question {currentQuestionIndex + 1} of {collection.words.length}
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
              <h2 className="text-4xl font-bold text-foreground">{currentWord.english}</h2>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentWord.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentWord.correctAnswer;
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
                selectedAnswer === currentWord.correctAnswer
                  ? "text-emerald"
                  : "text-destructive"
              }`}
            >
              {selectedAnswer === currentWord.correctAnswer
                ? "Correct! +100 points"
                : `Incorrect. The answer was: ${currentWord.correctAnswer}`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
