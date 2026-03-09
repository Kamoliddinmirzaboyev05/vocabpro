import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Volume2, RotateCw, X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "motion/react";
import * as api from "../utils/api";
import { PageSkeleton } from "./PageSkeleton";

export function Flashcards() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [unknownWords, setUnknownWords] = useState<string[]>([]);

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

  const currentWord = collection?.words[currentIndex];
  const progress = ((currentIndex + 1) / (collection?.words.length || 1)) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    if (currentWord) {
      setKnownWords([...knownWords, currentWord.id]);
      moveToNext();
    }
  };

  const handleUnknown = () => {
    if (currentWord) {
      setUnknownWords([...unknownWords, currentWord.id]);
      moveToNext();
    }
  };

  const moveToNext = () => {
    setIsFlipped(false);
    if (currentIndex < (collection?.words.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      navigate("/summary", {
        state: {
          score: knownWords.length * 100,
          total: collection?.words.length || 0,
          isFlashcards: true,
          knownCount: knownWords.length,
          unknownCount: unknownWords.length,
          collectionName: collection?.name,
        },
      });
    }
  };

  const speakWord = () => {
    if (currentWord) {
      const utterance = new SpeechSynthesisUtterance(currentWord.english);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return <PageSkeleton variant="flashcards" />;
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
      <div className="max-w-3xl mx-auto">
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
                Card {currentIndex + 1} of {collection.words.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-xl font-semibold text-emerald">{Math.round(progress)}%</div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="perspective-1000 mb-6">
          <motion.div
            className="relative w-full"
            style={{ minHeight: "400px" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            onClick={handleFlip}
          >
            <Card
              className="absolute inset-0 cursor-pointer border-2 hover:border-emerald transition-colors"
              style={{
                backfaceVisibility: "hidden",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Front of card */}
              <div className="h-full flex flex-col items-center justify-center p-12">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald/20 mb-4">
                    <Volume2 className="h-8 w-8 text-emerald" />
                  </div>
                  <h2 className="text-5xl font-bold text-foreground">
                    {currentWord.english}
                  </h2>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord();
                    }}
                    variant="outline"
                    className="border-emerald text-emerald hover:bg-emerald hover:text-white"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    Pronounce
                  </Button>
                  <div className="pt-8">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <RotateCw className="h-4 w-4 mr-2" />
                      <span className="text-sm">Click to flip</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              className="absolute inset-0 cursor-pointer border-2 hover:border-emerald transition-colors"
              style={{
                backfaceVisibility: "hidden",
                transformStyle: "preserve-3d",
                transform: "rotateY(180deg)",
              }}
            >
              {/* Back of card */}
              <div className="h-full flex flex-col items-center justify-center p-12">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Translation</p>
                      <h2 className="text-4xl font-bold text-emerald">
                        {currentWord.translation}
                      </h2>
                    </div>
                    <div className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">Example</p>
                      <p className="text-lg text-foreground italic">
                        "{currentWord.exampleSentence}"
                      </p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <RotateCw className="h-4 w-4 mr-2" />
                      <span className="text-sm">Click to flip back</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <Button
              onClick={handleUnknown}
              className="h-16 bg-[#dc2626] hover:bg-[#b91c1c] text-white"
            >
              <X className="mr-2 h-5 w-5" />
              Didn't Know
            </Button>
            <Button
              onClick={handleKnown}
              className="h-16 bg-emerald hover:bg-emerald-dark text-white"
            >
              <Check className="mr-2 h-5 w-5" />
              Got It!
            </Button>
          </motion.div>
        )}

        {!isFlipped && (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              Study the word, then flip the card to see the translation and example
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="bg-emerald/10 border-emerald p-4">
            <div className="text-center">
              <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald">{knownWords.length}</p>
              <p className="text-sm text-muted-foreground">Known</p>
            </div>
          </Card>
          <Card className="bg-destructive/10 border-destructive p-4">
            <div className="text-center">
              <X className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">{unknownWords.length}</p>
              <p className="text-sm text-muted-foreground">Need Practice</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
