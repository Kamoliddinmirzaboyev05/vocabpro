import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, BookOpen, Swords, Brain, Loader2 } from "lucide-react";
import { mockCollections } from "../data/mockData";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import * as api from "../utils/api";
import { supabase } from "../utils/supabaseClient";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export function Dashboard() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createMode, setCreateMode] = useState<"manual" | "ai">("manual");
  const [manualWords, setManualWords] = useState("");
  const [aiSource, setAiSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await api.getAllCollections();
      
      // If no collections exist, try to seed with mock data
      // But if backend is unavailable, just use mock data directly
      if (data.length === 0) {
        try {
          await seedCollections();
        } catch (seedError) {
          console.log("Backend not available, using mock data");
          setCollections(mockCollections);
        }
      } else {
        setCollections(data);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
      // Fallback to mock data
      setCollections(mockCollections);
    } finally {
      setLoading(false);
    }
  };

  const seedCollections = async () => {
    try {
      setSeeding(true);
      console.log("Seeding initial collections...");
      
      // Check session before seeding
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("No session found, skipping seeding");
        return;
      }

      for (const mockCollection of mockCollections) {
        await api.createCollection(
          mockCollection.name, // createCollection now maps this to 'title'
          mockCollection.description,
          mockCollection.words
        );
      }
      
      // Reload collections after seeding
      const data = await api.getAllCollections();
      setCollections(data);
      console.log("Collections seeded successfully");
    } catch (error) {
      console.error("Failed to seed collections:", error);
      throw error; // Re-throw to trigger fallback in loadCollections
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateCollection = async () => {
    try {
      if (!newCollectionName.trim()) return;
      const words =
        createMode === "manual"
          ? manualWords
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [english, translation] = line.split("-").map((s) => s.trim());
                return {
                  english,
                  translation: translation || "",
                  options: [],
                  correctAnswer: translation || "",
                  exampleSentence: "",
                };
              })
          : [];
      await api.createCollection(
        newCollectionName,
        createMode === "ai" && aiSource ? `AI imported from: ${aiSource}` : "User created",
        words,
      );
      await loadCollections();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDialogOpen(false);
      setNewCollectionName("");
      setManualWords("");
      setAiSource("");
      setCreateMode("manual");
    }
  };

  if (loading || seeding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald animate-spin mx-auto mb-4" />
          <p className="text-foreground">
            {seeding ? "Setting up your collections..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">VocabMaster AI</h1>
              <p className="text-sm md:text-base text-muted-foreground">Build your vocabulary through interactive learning</p>
            </div>
            <div className="flex items-center gap-4 self-end md:self-auto">
              <Button onClick={handleSignOut} variant="ghost" className="text-foreground hidden md:inline-flex">
                Sign Out
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald hover:bg-emerald-dark">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Collection
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="name" className="text-foreground">Collection Name</Label>
                    <Input
                      id="name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="e.g., Academic Vocabulary"
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "manual" | "ai")}>
                    <TabsList>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="ai">AI Import</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="mt-3">
                      <Label className="text-foreground mb-2 block">Words (one per line)</Label>
                      <textarea
                        value={manualWords}
                        onChange={(e) => setManualWords(e.target.value)}
                        placeholder="Format: English - Translation"
                        className="w-full min-h-32 p-3 rounded-lg bg-secondary border border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Example:
                        <br />
                        hello - hola
                        <br />
                        world - mundo
                      </p>
                    </TabsContent>
                    <TabsContent value="ai" className="mt-3">
                      <Label className="text-foreground mb-2 block">Source</Label>
                      <Input
                        value={aiSource}
                        onChange={(e) => setAiSource(e.target.value)}
                        placeholder="Paste text or link to analyze"
                        className="bg-secondary border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        The app will parse the content and suggest a collection.
                      </p>
                    </TabsContent>
                  </Tabs>
                  <Button 
                    onClick={handleCreateCollection}
                    className="w-full bg-emerald hover:bg-emerald-dark"
                  >
                    Create Collection
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">My Collections</h2>
          {collections.length === 0 ? (
            <Card className="bg-[#1D2639] border-transparent p-8">
              <div className="text-center space-y-4">
                <p className="text-foreground">
                  You haven't added any words yet. Create your first collection to start learning.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-emerald hover:bg-emerald-dark"
                >
                  Create Your First Collection
                </Button>
              </div>
            </Card>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="border-transparent p-6 hover:shadow-lg transition-all duration-300"
                style={{ backgroundColor: "#1D2639" }}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-slate-400">{collection.description}</p>
                  </div>
                  
                  <div className="flex items-center text-slate-400">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="text-sm">{collection.wordCount} words</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      onClick={() => navigate(`/battle/${collection.id}`)}
                      className="col-span-2 text-white font-semibold h-10"
                      style={{ backgroundColor: "#10B981" }}
                    >
                      <Swords className="h-4 w-4 mr-2" />
                      Battle
                    </Button>
                    <Button
                      onClick={() => navigate(`/quiz/${collection.id}`)}
                      className="bg-slate-700 hover:bg-slate-600 text-white h-9"
                      size="sm"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Quiz
                    </Button>
                    <Button
                      onClick={() => navigate(`/flashcards/${collection.id}`)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-9"
                      size="sm"
                    >
                      Cards
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
