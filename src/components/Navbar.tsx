import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const fullName = user ? `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() : "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 px-6 backdrop-blur-md bg-black/80 border-b border-[#2A2A2A] flex items-center justify-between">
        <Link to="/" className="text-white"><Logo height={32} /></Link>

        <nav className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-[#A1A1A1] hover:text-white text-[14px] font-[Proza_Libre] transition">Dashboard</Link>
              <Link to="/showcase" className="text-[#A1A1A1] hover:text-white text-[14px] font-[Proza_Libre] transition">Showcase</Link>
              <Link to="/profile/$userId" params={{ userId: user.id }}>
                <Avatar name={fullName} size={36} />
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/login" })}>Log In</Button>
              <Button variant="primary" onClick={() => navigate({ to: "/signup" })}>Sign Up</Button>
            </>
          )}
        </nav>

        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6"/> : <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>}
          </svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-black pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-2xl font-[Unbounded]">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-white">Dashboard</Link>
                <Link to="/showcase" onClick={() => setOpen(false)} className="text-white">Showcase</Link>
                <Link to="/profile/$userId" params={{ userId: user.id }} onClick={() => setOpen(false)} className="text-white">Profile</Link>
                <Link to="/connections" onClick={() => setOpen(false)} className="text-white">Connections</Link>
                <button onClick={handleLogout} className="text-left text-[#FF6B6B]">Log Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-white">Log In</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="text-white">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
