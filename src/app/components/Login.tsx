import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { supabase } from "../utils/supabaseClient";

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      alert("Failed to login with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#0B1221" }}>
      <Card className="w-full max-w-md p-8 border-transparent" style={{ backgroundColor: "#1D2639" }}>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Master Your Vocabulary
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Join 10,000+ students learning with AI-driven battles.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full h-12 text-base font-medium flex items-center justify-center gap-3"
              style={{ backgroundColor: "#10B981" }}
            >
              {loading ? (
                <span className="text-white">Redirecting...</span>
              ) : (
                <>
                  <span className="inline-block">
                    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                      <g>
                        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="#FBBC05" d="M48 24c0-1.61-.15-3.15-.45-4.65H24v9.02h13.5c-.58 3.1-2.35 5.72-4.96 7.46l7.73 6C44.79 37.6 48 31.42 48 24z"></path>
                        <path fill="#EA4335" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      </g>
                    </svg>
                  </span>
                  Continue with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Login;
