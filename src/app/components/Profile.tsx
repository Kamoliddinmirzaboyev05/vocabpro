import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { User, LogOut, Loader2, Award, Zap, BookOpen } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B1221]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0B1221] p-6 text-center">
        <p className="mb-4 text-white">Please sign in to view your profile.</p>
        <Button onClick={() => navigate("/")} className="bg-emerald-500 hover:bg-emerald-600">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1221] p-6 pb-24 md:pb-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 border-4 border-[#1D2639]">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback className="bg-[#1D2639] text-2xl text-emerald-500">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              {user.user_metadata?.full_name || "User"}
            </h1>
            <p className="text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none bg-[#1D2639] p-4 text-center">
            <div className="mb-2 flex justify-center text-emerald-500">
              <Zap className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-white">12</div>
            <div className="text-xs text-slate-400">Battles Won</div>
          </Card>
          <Card className="border-none bg-[#1D2639] p-4 text-center">
            <div className="mb-2 flex justify-center text-emerald-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-white">145</div>
            <div className="text-xs text-slate-400">Words Learned</div>
          </Card>
          <Card className="col-span-2 border-none bg-[#1D2639] p-4 text-center">
            <div className="mb-2 flex justify-center text-yellow-500">
              <Award className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-white">Level 5</div>
            <div className="text-xs text-slate-400">Vocabulary Master</div>
          </Card>
        </div>

        <Separator className="bg-slate-800" />

        {/* Account Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <Button
            variant="destructive"
            className="w-full justify-start bg-red-900/20 text-red-500 hover:bg-red-900/40"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
