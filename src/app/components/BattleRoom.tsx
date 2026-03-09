import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Trophy, Zap, Loader2, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import * as api from "../utils/api";

export function BattleRoom() {
  const { collectionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState<any>(null);
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fastestAnswerer, setFastestAnswerer] = useState<string | null>(null);
  const [answerTimestamps, setAnswerTimestamps] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [opponentToast, setOpponentToast] = useState<string | null>(null);
  const prevProgressRef = useRef<Record<string, number>>({});

  const battleId = searchParams.get("battleId");

  useEffect(() => {
    if (!battleId && collectionId) {
      // Create a new battle
      setIsHost(true);
    } else if (battleId) {
      // Join existing battle
      setIsHost(false);
    }
  }, [battleId, collectionId]);

  const loadBattle = useCallback(async () => {
    if (!battleId) return;
    
    try {
      const battleData = await api.getBattle(battleId);
      setBattle(battleData);

      // Opponent progress toast
      const prev = prevProgressRef.current;
      if (battleData?.participants) {
        for (const p of battleData.participants) {
          const prevVal = prev[p.id] ?? 0;
          if (p.progress > prevVal && p.id !== participantId) {
            setOpponentToast(`${p.name} is on fire! 🔥`);
            setTimeout(() => setOpponentToast(null), 1500);
          }
          prev[p.id] = p.progress;
        }
        prevProgressRef.current = { ...prev };
      }
      
      if (battleData.status === "active" && !collection) {
        const collectionData = await api.getCollection(battleData.collectionId);
        setCollection(collectionData);
      }
    } catch (error) {
      console.error("Failed to load battle:", error);
    }
  }, [battleId, collection]);

  useEffect(() => {
    if (battleId && !showNamePrompt) {
      const interval = setInterval(loadBattle, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [battleId, showNamePrompt, loadBattle]);

  // Per-question countdown
  useEffect(() => {
    setSecondsLeft(20);
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (showFeedback) return s; // pause during feedback
        if (s <= 1) {
          clearInterval(t);
          // Auto-advance on timeout
          if (currentQuestionIndex < (collection?.words.length || 0) - 1) {
            setCurrentQuestionIndex((i) => i + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setFastestAnswerer(null);
            setAnswerTimestamps({});
          } else {
            completeBattleAndNavigate();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, collection?.words.length, showFeedback]);

  const handleJoinOrCreate = async () => {
    if (!playerName.trim()) return;
    
    try {
      setLoading(true);
      
      if (isHost && collectionId) {
        // Create new battle
        const newBattle = await api.createBattle(collectionId, playerName);
        setBattle(newBattle);
        setParticipantId(newBattle.participants[0].id);
        
        const collectionData = await api.getCollection(collectionId);
        setCollection(collectionData);
        
        // Update URL with battle ID
        const newUrl = `/battle/${collectionId}?battleId=${newBattle.id}`;
        window.history.replaceState(null, "", newUrl);
      } else if (battleId) {
        // Join existing battle
        const { battle: joinedBattle, participantId: newParticipantId } = 
          await api.joinBattle(battleId, playerName);
        setBattle(joinedBattle);
        setParticipantId(newParticipantId);
        
        const collectionData = await api.getCollection(joinedBattle.collectionId);
        setCollection(collectionData);
      }
      
      setShowNamePrompt(false);
    } catch (error) {
      console.error("Failed to join/create battle:", error);
      alert("Failed to join battle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBattle = async () => {
    if (!battleId || !battle) return;
    
    try {
      const startedBattle = await api.startBattle(battleId);
      setBattle(startedBattle);
    } catch (error) {
      console.error("Failed to start battle:", error);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showFeedback || !battle || !battleId || !participantId) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    try {
      const timestamp = Date.now();
      const { battle: updatedBattle, isCorrect } = await api.submitAnswer(
        battleId,
        participantId,
        answer,
        currentQuestionIndex
      );
      
      setBattle(updatedBattle);
      
      // Track who answered first
      setAnswerTimestamps((prev) => ({ ...prev, [participantId]: timestamp }));
      
      // Determine fastest answerer
      const allTimestamps = Object.entries({ ...answerTimestamps, [participantId]: timestamp });
      if (allTimestamps.length > 0) {
        const fastest = allTimestamps.reduce((min, curr) => 
          curr[1] < min[1] ? curr : min
        );
        const fastestParticipant = updatedBattle.participants.find(
          (p: any) => p.id === fastest[0]
        );
        setFastestAnswerer(fastestParticipant?.name || null);
      }

      setTimeout(() => {
        if (currentQuestionIndex < (collection?.words.length || 0) - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setFastestAnswerer(null);
          setAnswerTimestamps({});
        } else {
          // Battle complete
          completeBattleAndNavigate();
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setShowFeedback(false);
    }
  };

  const completeBattleAndNavigate = async () => {
    if (!battleId || !battle) return;
    
    try {
      await api.completeBattle(battleId);
      
      const sortedParticipants = [...battle.participants].sort(
        (a: any, b: any) => b.score - a.score
      );
      
      navigate("/summary", {
        state: {
          score: battle.participants.find((p: any) => p.id === participantId)?.score || 0,
          total: collection?.words.length || 0,
          isBattle: true,
          participants: sortedParticipants,
          collectionName: collection?.name,
        },
      });
    } catch (error) {
      console.error("Failed to complete battle:", error);
    }
  };

  const copyInviteLink = () => {
    if (!battleId) return;
    const inviteUrl = `${window.location.origin}/battle/${collectionId}?battleId=${battleId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Name prompt screen
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="bg-card border-border p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Trophy className="h-16 w-16 text-emerald mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isHost ? "Host a Battle" : "Join Battle"}
            </h1>
            <p className="text-muted-foreground">
              {isHost 
                ? "Create a battle room and invite your friends"
                : "Enter your name to join the battle"}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="playerName" className="text-foreground">Your Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinOrCreate()}
                placeholder="Enter your name"
                className="bg-secondary border-border text-foreground"
                autoFocus
              />
            </div>
            
            <Button 
              onClick={handleJoinOrCreate}
              disabled={!playerName.trim() || loading}
              className="w-full bg-emerald hover:bg-emerald-dark"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isHost ? "Creating..." : "Joining..."}
                </>
              ) : (
                isHost ? "Create Battle Room" : "Join Battle"
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full border-border text-foreground"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Waiting room
  if (battle?.status === "waiting") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card className="bg-card border-border p-8">
            <div className="text-center mb-8">
              <Trophy className="h-16 w-16 text-emerald mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-2">Waiting for Players</h1>
              <p className="text-muted-foreground">
                Share the invite link below to let others join
              </p>
            </div>

            {/* Invite Link */}
            {isHost && battleId && (
              <div className="mb-8 p-4 bg-secondary rounded-lg">
                <Label className="text-foreground mb-2 block">Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/battle/${collectionId}?battleId=${battleId}`}
                    readOnly
                    className="bg-background border-border text-foreground"
                  />
                  <Button
                    onClick={copyInviteLink}
                    className="bg-emerald hover:bg-emerald-dark"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Participants ({battle.participants.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {battle.participants.map((participant: any) => (
                  <Card key={participant.id} className="bg-secondary border-border p-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{participant.avatar}</div>
                      <p className="font-semibold text-foreground">{participant.name}</p>
                      {participant.isHost && (
                        <span className="text-xs text-emerald">Host</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Start Button */}
            {isHost && (
              <Button
                onClick={handleStartBattle}
                disabled={battle.participants.length < 1}
                className="w-full bg-emerald hover:bg-emerald-dark h-14 text-lg"
              >
                Start Battle
              </Button>
            )}
            
            {!isHost && (
              <p className="text-center text-muted-foreground">
                Waiting for host to start the battle...
              </p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Loading or battle active
  if (loading || !collection || !battle || battle.status !== "active") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading battle...</p>
        </div>
      </div>
    );
  }

  const currentWord = collection.words[currentQuestionIndex];
  const sortedParticipants = [...battle.participants].sort((a: any, b: any) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Live Battle</h2>
                <div className="flex items-center gap-6">
                  <div className="relative size-14">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#10B981 ${(secondsLeft / 20) * 100}%, rgba(148,163,184,0.2) 0)`,
                      }}
                    />
                    <div className="absolute inset-1 rounded-full flex items-center justify-center bg-background">
                      <span className="text-foreground font-semibold">{secondsLeft}s</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Step {currentQuestionIndex + 1}/{collection.words.length}
                    </div>
                  </div>
                </div>
              </div>
              <Progress
                value={((currentQuestionIndex + 1) / collection.words.length) * 100}
                className="h-2 bg-secondary mb-6"
              />

              {/* Leaderboard Rail */}
              <div className="relative h-16 mb-6 rounded-lg bg-secondary overflow-hidden border border-border">
                {battle.participants.map((p: any) => (
                  <motion.div
                    key={p.id}
                    className="absolute top-2"
                    initial={false}
                    animate={{ left: `${Math.min(p.progress, 100)}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  >
                    <div className="flex items-center -translate-x-1/2">
                      <div className="text-sm px-2 py-1 rounded-full bg-[#1D2639] border border-border text-foreground shadow">
                        {p.avatar} <span className="ml-1">{p.name}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              </div>

              {/* Question */}
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Translate:</p>
                  <h2 className="text-4xl font-bold text-foreground">{currentWord.english}</h2>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentWord.options.map((option: string, index: number) => {
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
                          onClick={() => handleAnswer(option)}
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
              </motion.div>

              {/* Fastest Answerer Alert */}
              <AnimatePresence>
                {showFeedback && fastestAnswerer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 p-4 bg-emerald/20 border border-emerald rounded-lg flex items-center justify-center"
                  >
                    <Zap className="h-5 w-5 text-emerald mr-2" />
                    <span className="text-emerald font-semibold">
                      {fastestAnswerer} answered first!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Opponent Toast */}
              <AnimatePresence>
                {opponentToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-6 right-6 z-50"
                  >
                    <div className="px-4 py-3 rounded-lg bg-[#1D2639] border border-emerald text-foreground shadow">
                      {opponentToast}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-emerald" />
                Live Leaderboard
              </h3>
              <div className="space-y-4">
                {sortedParticipants.map((participant: any, index: number) => (
                  <motion.div
                    key={participant.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      participant.id === participantId
                        ? "bg-emerald/10 border-emerald"
                        : "bg-secondary border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{participant.avatar}</div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {participant.name}
                            {participant.id === participantId && (
                              <span className="text-xs text-emerald ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {participant.score} pts
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald">#{index + 1}</div>
                      </div>
                    </div>
                    <Progress value={participant.progress} className="h-2 bg-background" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
