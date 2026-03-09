import { useLocation, useNavigate } from "react-router";
import { Trophy, Medal, BookOpen, RotateCw, Home, Target } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "motion/react";
 

interface LocationState {
  score: number;
  total: number;
  isBattle?: boolean;
  isFlashcards?: boolean;
  participants?: any[];
  answeredWords?: { word: any; correct: boolean }[];
  knownCount?: number;
  unknownCount?: number;
  collectionName?: string;
}

export function Summary() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">No summary data available</p>
          <Button onClick={() => navigate("/dashboard")} className="bg-emerald hover:bg-emerald-dark">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const {
    score,
    total,
    isBattle,
    isFlashcards,
    participants,
    answeredWords,
    knownCount,
    unknownCount,
    collectionName,
  } = state;

  const userRank = isBattle
    ? (participants?.findIndex((p) => p.isCurrentUser) ?? -1) + 1
    : null;

  const troubleWords = answeredWords?.filter((aw) => !aw.correct) || [];
  const correctCount = answeredWords?.filter((aw) => aw.correct).length || knownCount || 0;
  const percentage = Math.round((correctCount / total) * 100);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-emerald";
      case 2:
        return "text-blue-400";
      case 3:
        return "text-orange-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center mb-8"
        >
          <div className="text-8xl mb-4">
            {isBattle ? getRankIcon(userRank || 4) : isFlashcards ? "📚" : "🎯"}
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isBattle
              ? userRank === 1
                ? "Victory!"
                : "Battle Complete!"
              : isFlashcards
              ? "Study Session Complete!"
              : "Quiz Complete!"}
          </h1>
          <p className="text-xl text-muted-foreground">{collectionName}</p>
        </motion.div>

        {/* Battle Ranking */}
        {isBattle && participants && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-card border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-emerald" />
                Final Rankings
              </h2>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      participant.isCurrentUser
                        ? "bg-emerald/10 border-emerald"
                        : "bg-secondary border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`text-3xl ${getRankColor(index + 1)}`}>
                          {getRankIcon(index + 1)}
                        </div>
                        <div className="text-2xl">{participant.avatar}</div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {participant.name}
                            {participant.isCurrentUser && (
                              <span className="text-xs text-emerald ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {participant.score} points
                          </p>
                        </div>
                      </div>
                      <div className={`text-3xl font-bold ${getRankColor(index + 1)}`}>
                        #{index + 1}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Score Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-card border-border p-6">
            <div className="text-center">
              <Target className="h-8 w-8 text-emerald mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{score}</p>
              <p className="text-sm text-muted-foreground">Total Score</p>
            </div>
          </Card>
          <Card className="bg-card border-border p-6">
            <div className="text-center">
              <BookOpen className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">
                {correctCount}/{total}
              </p>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
            </div>
          </Card>
          <Card className="bg-card border-border p-6">
            <div className="text-center">
              <Medal className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{percentage}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </Card>
        </motion.div>

        {/* Trouble Words */}
        {troubleWords.length > 0 && !isFlashcards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-card border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Words to Review ({troubleWords.length})
              </h2>
              <div className="space-y-3">
                {troubleWords.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="p-4 bg-secondary rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{item.word.english}</p>
                        <p className="text-sm text-emerald">{item.word.translation}</p>
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {item.word.exampleSentence}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full mt-4 bg-emerald hover:bg-emerald-dark"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Review Now
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-14 border-emerald text-emerald hover:bg-emerald hover:text-white"
          >
            <RotateCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="h-14 bg-navy hover:bg-navy/80"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Encouragement Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-muted-foreground">
            {percentage >= 80
              ? "🌟 Excellent work! You're mastering this vocabulary!"
              : percentage >= 60
              ? "💪 Good effort! Keep practicing to improve!"
              : "📖 Keep studying! Practice makes perfect!"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
