import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectCard } from "@/components/ProjectCard";
import { Input } from "@/components/Input";
import { fetchCompletedProjects, type OrbytProject } from "@/lib/data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/showcase")({ component: Showcase });

function Showcase() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<OrbytProject[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const completed = await fetchCompletedProjects();
      setProjects(completed);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-white text-[32px] font-[Unbounded] mb-2">Project Showcase</h1>
          <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre]">
            Explore completed projects from the community. Test them out and leave reviews!
          </p>
        </div>

        <Input
          placeholder="Search completed projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#A1A1A1] font-[Proza_Libre]">Loading projects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#A1A1A1] text-[16px] font-[Proza_Libre]">
              {search ? "No projects match your search." : "No completed projects yet."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
