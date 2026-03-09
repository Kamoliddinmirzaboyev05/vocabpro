import { useNavigate, useLocation } from "react-router";
import { Home, User, Swords } from "lucide-react";
import { cn } from "./ui/utils";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#1D2639] border-t border-slate-700 flex justify-around items-center z-50 md:hidden">
      <button
        onClick={() => navigate("/dashboard")}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
          isActive("/dashboard") ? "text-[#10B981]" : "text-slate-400 hover:text-slate-200"
        )}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs font-medium">Home</span>
      </button>
      
      {/* Placeholder for future Battle/Leaderboard tab if needed, 
          currently linking to Dashboard or could be a modal */}
      <button
        onClick={() => navigate("/dashboard")} // Or create a dedicated /battles page
        className={cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
          isActive("/battles") ? "text-[#10B981]" : "text-slate-400 hover:text-slate-200"
        )}
      >
        <Swords className="h-6 w-6" />
        <span className="text-xs font-medium">Battle</span>
      </button>

      <button
        onClick={() => navigate("/profile")}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
          isActive("/profile") ? "text-[#10B981]" : "text-slate-400 hover:text-slate-200"
        )}
      >
        <User className="h-6 w-6" />
        <span className="text-xs font-medium">Profile</span>
      </button>
    </div>
  );
}
