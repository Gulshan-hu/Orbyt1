import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "./Navbar";
import { Avatar } from "./Avatar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/dashboard", label: "Discover", icon: "M12 2l9 7-9 13L3 9z" },
  { to: "/profile/me", label: "My Profile", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" },
  { to: "/connections", label: "Connections", icon: "M8 11a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8zM2 21a6 6 0 0112 0M14 21a6 6 0 0110-4" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  const fullName = `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim();
  const major = user.user_metadata?.major || "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const sidebar = (
    <aside className="w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
      <div className="p-5 flex items-center gap-3">
        <Avatar name={fullName} size={44} avatarUrl={user.user_metadata?.avatar_url} />
        <div className="min-w-0">
          <div className="text-white text-[13px] font-[Unbounded] truncate">{fullName}</div>
          <div className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] truncate">{major}</div>
        </div>
      </div>
      <div className="border-t border-[#2A2A2A] my-2" />
      <nav className="px-3 flex flex-col gap-1 flex-1">
        {NAV.map(n => {
          const active = path === n.to || (n.to === "/profile/me" && path.startsWith("/profile/"));
          return (
            <Link key={n.to} to={n.to as any} onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[14px] font-[Proza_Libre] transition ${active ? "bg-[#1A1A1A] text-white border-l-2 border-white pl-3" : "text-[#A1A1A1] hover:bg-[#1A1A1A] hover:text-white"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <button onClick={handleLogout}
        className="w-full text-[#A1A1A1] hover:text-white border-t border-[#2A2A2A] p-4 text-[14px] font-[Proza_Libre] text-left transition">
        Log Out
      </button>
    </aside>
  );

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="pt-16 flex">
        <div className="hidden lg:block fixed top-16 left-0">{sidebar}</div>
        {drawerOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <div className="fixed top-16 left-0 z-50 lg:hidden">{sidebar}</div>
          </>
        )}
        <main className="flex-1 lg:ml-60 p-6 md:p-8 min-h-[calc(100vh-64px)]">
          <button className="lg:hidden mb-4 inline-flex items-center gap-2 text-[#A1A1A1]" onClick={() => setDrawerOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            <span className="text-[14px]">Menu</span>
          </button>
          {children}
        </main>
      </div>
    </div>
  );
}
