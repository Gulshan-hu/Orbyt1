import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ProjectCard } from "@/components/ProjectCard";
import { UserCard } from "@/components/UserCard";
import { fetchAllProjects, fetchAllUsers, projectMatchScore, userMatchScore, type OrbytProject, type OrbytUser } from "@/lib/data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const FILTERS = ["All","Projects","Users","Best Matches","Newly Added"] as const;

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [sort, setSort] = useState("Match Score");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<OrbytProject[]>([]);
  const [users, setUsers] = useState<OrbytUser[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/login" }); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [allProjects, allUsers] = await Promise.all([
        fetchAllProjects(),
        fetchAllUsers(),
      ]);
      const me = allUsers.find(u => u.id === user.id);
      setMySkills(me?.skills || []);

      // Filter out own projects and add match scores
      const projectsWithScores = allProjects
        .filter(p => p.captainId !== user.id)
        .map(p => ({ ...p, matchScore: projectMatchScore(me?.skills || [], p) }));

      // Filter out self and add match scores
      const usersWithScores = allUsers
        .filter(u => u.id !== user.id)
        .map(u => ({ ...u, matchScore: userMatchScore(me?.skills || [], u.skills) }));

      setProjects(projectsWithScores);
      setUsers(usersWithScores);
      setLoading(false);
    };
    load();
  }, [user]);

  const recommendedProjects = useMemo(() =>
    projects.slice().sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 4),
    [projects]
  );

  const recommendedUsers = useMemo(() =>
    users.slice().sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 4),
    [users]
  );

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter(p => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.skillsHave.some(s => s.toLowerCase().includes(q)) || p.skillsNeed.some(n => n.skill.toLowerCase().includes(q)));
  }, [search, projects]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.skills.some(s => s.toLowerCase().includes(q)));
  }, [search, users]);

  const showProjects = filter === "All" || filter === "Projects" || filter === "Best Matches" || filter === "Newly Added";
  const showUsers = filter === "All" || filter === "Users";

  return (
    <DashboardLayout>
      <div className="max-w-[1200px]">
        <div className="mb-8">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1A1" strokeWidth="2" className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <Input className="!rounded-[999px] !pl-12" placeholder="Search projects, skills, users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex justify-between items-center mt-4 gap-3 flex-wrap">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`whitespace-nowrap rounded-[999px] px-[18px] py-2 text-[14px] font-[Proza_Libre] transition border ${filter === f ? "bg-white text-black border-white" : "bg-[#1A1A1A] text-[#A1A1A1] border-[#2A2A2A] hover:border-[#E2E2E2]"}`}>{f}</button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[10px] px-3.5 py-2 text-[#A1A1A1] text-[14px] font-[Proza_Libre]">
              <option>Match Score ↓</option><option>Newest</option><option>Rating</option>
            </select>
          </div>
        </div>

        <h2 className="text-white text-[18px] mb-5">Recommended for you</h2>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer rounded-[16px] w-[300px] h-[280px] flex-shrink-0" />)}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
            {recommendedProjects.map(p => {
              const captain = users.find(u => u.id === p.captainId);
              return (
                <ProjectCard
                  key={p.id}
                  project={p}
                  recommended
                  captainName={captain ? `${captain.firstName} ${captain.lastName}` : "Captain"}
                  captainRating={captain?.averageRating || 0}
                />
              );
            })}
            {recommendedUsers.map(u => <UserCard key={u.id} user={u} recommended />)}
          </div>
        )}

        {showProjects && (
          <>
            <h2 className="text-white text-[18px] mt-12 mb-5">All projects</h2>
            {loading ? (
              <div className="grid lg:grid-cols-2 gap-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer rounded-[16px] h-[260px]" />)}</div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState onReset={() => { setSearch(""); setFilter("All"); }} />
            ) : (
              <div className="grid lg:grid-cols-2 gap-5">
                {filteredProjects.map(p => {
                  const captain = users.find(u => u.id === p.captainId);
                  return (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      captainName={captain ? `${captain.firstName} ${captain.lastName}` : "Captain"}
                      captainRating={captain?.averageRating || 0}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {showUsers && (
          <>
            <h2 className="text-white text-[18px] mt-12 mb-5">All users</h2>
            <div className="grid lg:grid-cols-2 gap-5">{filteredUsers.map(u => <UserCard key={u.id} user={u} />)}</div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-full w-20 h-20 flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A1A1A1" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      </div>
      <h3 className="text-white text-[18px] mb-2">No results found</h3>
      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-5">Try changing the search or filter</p>
      <Button variant="ghost" onClick={onReset}>Reset filters</Button>
    </div>
  );
}
