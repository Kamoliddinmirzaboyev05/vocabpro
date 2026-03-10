import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, BookOpen, Swords, Brain, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
  const [user, setUser] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("A1");
  const [activeFilter, setActiveFilter] = useState("All");
  
  const ADMIN_EMAIL = "kamoliddinmirzaboyev2005@gmail.com";

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    fetchCollectionsDirect();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  

  const fetchCollectionsDirect = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("collections")
        .select("*, words(*)")
        .order("created_at", { ascending: false });

      if (user) {
        // Fetch user's own collections OR public collections
        // Note: This requires an RLS policy that allows reading public collections
        // or the user_id matching logic.
        // Since we want "All" to show "My Collections" (which are private) 
        // and "Public" to show public ones, we might want to fetch everything 
        // and filter client-side, OR use an OR condition.
        // Assuming RLS allows reading 'is_public=true' for everyone.
        
        // However, standard supabase-js doesn't easily support "OR" across different columns 
        // combined with other filters in a simple way without 'or' method.
        // .or(`user_id.eq.${user.id},is_public.eq.true`)
        
        query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
      }

      const { data, error } = await query;
      
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
        isPublic,
        isPublic ? topic : null,
        isPublic ? level : null
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
      setIsPublic(false);
      setTopic("");
      setLevel("A1");
    }
  };

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const filteredCollections = collections.filter(c => {
    if (activeFilter === "All") {
      // Show user's collections (both private and public ones they own)
      // We explicitly check user_id to avoid showing public collections created by others in "All"
      return c.user_id === user?.id;
    }
    if (activeFilter === "Public") {
      // Show ONLY public collections
      // This includes Admin's public collections and any other public collections
      return c.is_public === true;
    }
    if (activeFilter === "Local") {
      // Show user's private collections
      return c.user_id === user?.id && c.is_public === false;
    }
    return true;
  });

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
              <Button onClick={() => navigate("/library")} variant="ghost" className="text-foreground hidden md:inline-flex">
                <BookOpen className="mr-2 h-4 w-4" />
                Library
              </Button>
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

                  {user?.email === ADMIN_EMAIL && (
                    <div className="p-4 border border-blue-500/30 rounded-md bg-blue-500/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="public-mode" className="text-foreground font-semibold">Make Public</Label>
                        <Switch
                          id="public-mode"
                          checked={isPublic}
                          onCheckedChange={setIsPublic}
                        />
                      </div>
                      
                      {isPublic && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <Label htmlFor="topic" className="text-foreground">Topic</Label>
                            <Input
                              id="topic"
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              placeholder="e.g. Travel, Business"
                              className="bg-secondary border-border text-foreground mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="level" className="text-foreground">Level</Label>
                            <Select value={level} onValueChange={setLevel}>
                              <SelectTrigger className="w-full mt-1.5 bg-secondary border-border text-foreground">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent className="bg-secondary border-border text-foreground">
                                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                                  <SelectItem key={l} value={l}>{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveFilter("All")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "All"
                ? "bg-emerald text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("Public")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "Public"
                ? "bg-emerald text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setActiveFilter("Local")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "Local"
                ? "bg-emerald text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Local
          </button>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">
              {activeFilter === "Public" 
                ? "No public collections found"
                : activeFilter === "Local"
                ? "No local collections found"
                : "No collections found. Create one to get started!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Card
                key={collection.id}
                className="bg-card border-border hover:border-emerald transition-colors cursor-pointer group relative overflow-hidden"
              >
                <div onClick={() => navigate(`/quiz/${collection.id}`)} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-lg bg-emerald/10 flex items-center justify-center text-emerald group-hover:scale-110 transition-transform">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    {collection.is_public && (
                      <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded-full border border-blue-500/50">
                        Public
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {collection.title || collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{collection.description}</p>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="text-sm">{collection.wordCount || collection.word_count || 0} words</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/flashcards/${collection.id}`);
                        }}
                        variant="secondary"
                        className="w-full bg-secondary hover:bg-secondary/80 text-foreground"
                      >
                        <Brain className="mr-2 h-4 w-4" />
                        Study
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/battle/${collection.id}`);
                        }}
                        className="w-full bg-navy hover:bg-navy/80"
                      >
                        <Swords className="mr-2 h-4 w-4" />
                        Battle
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
