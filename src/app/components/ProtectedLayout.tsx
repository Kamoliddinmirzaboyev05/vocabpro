import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { BottomNav } from "./BottomNav";

export function ProtectedLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/", { replace: true });
      } else {
        setLoading(false);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B1221]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1221] pb-16 md:pb-0">
      <Outlet />
      <BottomNav />
    </div>
  );
}
