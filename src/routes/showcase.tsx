import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectCard } from "@/components/ProjectCard";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ProjectReviewModal } from "@/components/ProjectReviewModal";
import { fetchCompletedProjects, fetchProjectsForUser, addProjectToShowcase, fetchProjectReviews, type OrbytProject, type OrbytProjectReview } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/showcase")({ component: Showcase });

function Showcase() {
  const { user } = useAuth();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<OrbytProject[]>([]);
  const [myDoneProjects, setMyDoneProjects] = useState<OrbytProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<OrbytProject | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [projectReviews, setProjectReviews] = useState<Record<string, OrbytProjectReview[]>>({});

  const loadProjects = async () => {
    setLoading(true);
    const completed = await fetchCompletedProjects();
    setProjects(completed);
    if (user) {
      const myProjects = await fetchProjectsForUser(user.id);
      const done = myProjects.filter(p => p.status === 'done' && p.captainId === user.id);
      setMyDoneProjects(done);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!projects.length) return;

    // Set up real-time subscription for project reviews
    const channel = supabase
      .channel('project-reviews')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_reviews',
      }, async (payload) => {
        const projectId = payload.new.project_id;
        if (projectId) {
          const reviews = await fetchProjectReviews(projectId);
          setProjectReviews(prev => ({ ...prev, [projectId]: reviews }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projects]);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const handleReview = (project: OrbytProject) => {
    setSelectedProject(project);
    setReviewModalOpen(true);
  };

  const handleAddToShowcase = async (projectId: string) => {
    try {
      await addProjectToShowcase(projectId);
      show("Project added to showcase!");
      setAddModalOpen(false);
      loadProjects();
    } catch (error) {
      show("Failed to add project");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-white text-[32px] font-[Unbounded] mb-2">Project Showcase</h1>
            <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre]">
              Explore completed projects from the community. Test them out and leave reviews!
            </p>
          </div>
          {myDoneProjects.length > 0 && (
            <Button onClick={() => setAddModalOpen(true)}>+ Add Project</Button>
          )}
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
              <div key={p.id} className="relative">
                <ProjectCard project={p} currentUserId={user?.id} />
                <div className="mt-3">
                  <Button full variant="ghost" onClick={() => handleReview(p)}>
                    Write a Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProject && user && (
        <ProjectReviewModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedProject(null);
            loadProjects();
          }}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          reviewerId={user.id}
        />
      )}

      {addModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-8 w-full max-w-[480px]">
            <button onClick={() => setAddModalOpen(false)} aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-full text-[#A1A1A1] hover:text-white hover:bg-[#2A2A2A] transition">×</button>
            <h2 className="text-white text-[20px] mb-5">Add to Showcase</h2>
            <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-4">
              Select a completed project to add to the showcase:
            </p>
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {myDoneProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddToShowcase(p.id)}
                  className="text-left p-4 rounded-[12px] border border-[#2A2A2A] hover:border-[#E2E2E2] transition">
                  <div className="text-white text-[15px] font-[Unbounded] mb-1">{p.name}</div>
                  <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] line-clamp-2">{p.description}</p>
                </button>
              ))}
            </div>
            <Button variant="ghost" full className="mt-4" onClick={() => setAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
