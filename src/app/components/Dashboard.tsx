import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, BookOpen, Swords, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import * as api from "../utils/api";
import { PageSkeleton } from "./PageSkeleton";
import { supabase } from "../utils/supabaseClient";
 

export function Dashboard() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [createMode, setCreateMode] = useState<"manual" | "json">("manual");
  const [manualPairs, setManualPairs] = useState<{ english: string; translation: string }[]>([
    { english: "", translation: "" },
  ]);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchCollectionsDirect();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  

  const fetchCollectionsDirect = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("collections")
        .select("*, words(*)")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase collections fetch error:", error);
        return;
      }
      
      const normalized = (data || []).map((c: any) => ({
        ...c,
        name: c.title,
        wordCount: (c.words?.length ?? c.word_count) || 0,
        words: (c.words || []).map((w: any) => ({
          ...w,
          english: w.word,
          correctAnswer: w.translation,
          exampleSentence: w.example_sentence || "",
        })),
      }));
      setCollections(normalized);
    } catch (e) {
      console.error("Unexpected error fetching collections:", e);
    } finally {
      setLoading(false);
    }
  };

  

  const handleAddPair = () => {
    setManualPairs([...manualPairs, { english: "", translation: "" }]);
  };

  const handlePairChange = (index: number, field: "english" | "translation", value: string) => {
    const newPairs = [...manualPairs];
    newPairs[index][field] = value;
    setManualPairs(newPairs);
  };

  const handleRemovePair = (index: number) => {
    if (manualPairs.length > 1) {
      const newPairs = manualPairs.filter((_, i) => i !== index);
      setManualPairs(newPairs);
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
          setJsonError("Input must be a JSON object (key-value pairs)");
        } else {
          setJsonError(null);
        }
      } else {
        setJsonError(null);
      }
    } catch (e) {
      setJsonError("Invalid JSON format");
    }
  };

  const handleCreateCollection = async () => {
    try {
      if (!newCollectionName.trim()) return;
      
      let words: { english: string; translation: string }[] = [];

      if (createMode === "manual") {
        words = manualPairs
          .filter(p => p.english.trim() && p.translation.trim())
          .map(p => ({
            english: p.english.trim(),
            translation: p.translation.trim()
          }));
      } else {
        if (jsonError || !jsonInput.trim()) return;
        try {
          const parsed = JSON.parse(jsonInput);
          words = Object.entries(parsed).map(([key, value]) => ({
            english: key.trim(),
            translation: String(value).trim()
          }));
        } catch (e) {
          return;
        }
      }

      if (words.length === 0) return;

      await api.createCollection(
        newCollectionName,
        "User created collection",
        words,
      );
      await fetchCollectionsDirect();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDialogOpen(false);
      setNewCollectionName("");
      setManualPairs([{ english: "", translation: "" }]);
      setJsonInput("");
      setJsonError(null);
      setCreateMode("manual");
    }
  };

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
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
                  <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "manual" | "json")}>
                    <TabsList className="grid w-full grid-cols-2 bg-secondary">
                      <TabsTrigger 
                        value="manual"
                        className="data-[state=active]:bg-emerald data-[state=active]:text-white"
                      >
                        Manual Entry
                      </TabsTrigger>
                      <TabsTrigger 
                        value="json"
                        className="data-[state=active]:bg-emerald data-[state=active]:text-white"
                      >
                        JSON Bulk
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="space-y-3">
                        {manualPairs.map((pair, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-1">
                              {index === 0 && <Label className="text-xs text-muted-foreground">English Word</Label>}
                              <Input
                                value={pair.english}
                                onChange={(e) => handlePairChange(index, "english", e.target.value)}
                                placeholder="Word"
                                className="bg-secondary border-border text-foreground"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              {index === 0 && <Label className="text-xs text-muted-foreground">Translation</Label>}
                              <Input
                                value={pair.translation}
                                onChange={(e) => handlePairChange(index, "translation", e.target.value)}
                                placeholder="Translation"
                                className="bg-secondary border-border text-foreground"
                              />
                            </div>
                            {manualPairs.length > 1 && (
                              <div className={index === 0 ? "pt-5" : ""}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePair(index)}
                                  className="text-muted-foreground hover:text-red-500"
                                >
                                  <Plus className="h-4 w-4 rotate-45" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleAddPair}
                        className="w-full mt-4 border-dashed border-emerald text-emerald hover:bg-emerald/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add another pair
                      </Button>
                    </TabsContent>

                    <TabsContent value="json" className="mt-4">
                      <Label className="text-foreground mb-2 block">Paste JSON Object</Label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        placeholder='{
  "hello": "hola",
  "world": "mundo"
}'
                        className={`w-full min-h-[200px] p-3 rounded-lg bg-secondary border text-foreground font-mono text-sm ${
                          jsonError ? "border-red-500 focus:ring-red-500" : "border-border"
                        }`}
                      />
                      {jsonError ? (
                        <p className="text-xs text-red-500 mt-2">{jsonError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          Format: "word": "translation"
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                  <Button 
                    onClick={handleCreateCollection}
                    disabled={createMode === "json" && !!jsonError}
                    className="w-full bg-emerald hover:bg-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {collection.title || collection.name}
                    </h3>
                    <p className="text-sm text-slate-400">{collection.description}</p>
                  </div>
                  
                  <div className="flex items-center text-slate-400">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="text-sm">{collection.wordCount || collection.word_count || 0} words</span>
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
