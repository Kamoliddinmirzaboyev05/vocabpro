import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Copy, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import * as api from "../utils/api";
import { PageSkeleton } from "./PageSkeleton";

export function Library() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);

  useEffect(() => {
    loadPublicCollections();
  }, []);

  const loadPublicCollections = async () => {
    try {
      setLoading(true);
      const data = await api.getPublicCollections();
      setCollections(data);
    } catch (error) {
      console.error("Failed to load public collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (collectionId: string) => {
    try {
      setCloningId(collectionId);
      await api.cloneCollection(collectionId);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to clone collection:", error);
    } finally {
      setCloningId(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A1":
      case "A2":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50";
      case "B1":
      case "B2":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/50";
      case "C1":
      case "C2":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50";
      default:
        return "bg-slate-500/20 text-slate-500 hover:bg-slate-500/30 border-slate-500/50";
    }
  };

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Public Library</h1>
            <p className="text-sm md:text-base text-muted-foreground">Explore collections created by the community</p>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">No public collections available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="border-transparent p-6 hover:shadow-lg transition-all duration-300 bg-[#1D2639] flex flex-col h-full"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-1" title={collection.title || collection.name}>
                        {collection.title || collection.name}
                      </h3>
                      {collection.topic && (
                        <p className="text-sm text-slate-400 mb-2">{collection.topic}</p>
                      )}
                    </div>
                    {collection.level && (
                      <Badge className={`${getLevelColor(collection.level)} whitespace-nowrap`}>
                        {collection.level}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-slate-400">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="text-sm">{collection.wordCount || 0} words</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleClone(collection.id)}
                  disabled={cloningId === collection.id}
                  className="w-full bg-emerald hover:bg-emerald-dark text-white mt-6"
                >
                  {cloningId === collection.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Add to My Vocab
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
