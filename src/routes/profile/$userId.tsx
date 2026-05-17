import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Avatar } from "@/components/Avatar";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { EditProjectModal } from "@/components/EditProjectModal";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { ConnectModal } from "@/components/ConnectModal";
import { fetchUser, fetchProjectsForUser, fetchConnectionsForUser, type OrbytUser, type OrbytProject } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/$userId")({ component: ProfilePage });

const TABS = ["Projects","Connections"] as const;

function ProfilePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<typeof TABS[number]>("Projects");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<OrbytProject | null>(null);
  const [editProject, setEditProject] = useState<OrbytProject | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [connectProject, setConnectProject] = useState<OrbytProject | null>(null);
  const [user, setUser] = useState<OrbytUser | null>(null);
  const [projects, setProjects] = useState<OrbytProject[]>([]);
  const [connections, setConnections] = useState<OrbytUser[]>([]);

  useEffect(() => { if (!authLoading && !authUser) navigate({ to: "/login" }); }, [authUser, authLoading, navigate]);

  const loadData = async () => {
    const [userData, projectsData, connectionsData] = await Promise.all([
      fetchUser(userId),
      fetchProjectsForUser(userId),
      fetchConnectionsForUser(userId),
    ]);
    setUser(userData);
    setProjects(projectsData);
    setConnections(connectionsData);
  };

  useEffect(() => {
    if (!authUser) return;
    loadData();

    // Set up real-time subscription for user profile updates
    const userChannel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, () => {
        loadData();
      })
      .subscribe();

    // Set up real-time subscription for user skills updates
    const skillsChannel = supabase
      .channel(`user-skills-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_skills',
        filter: `user_id=eq.${userId}`,
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(skillsChannel);
    };
  }, [userId, authUser]);

  if (!user) return <DashboardLayout><p className="text-[#A1A1A1]">User not found.</p></DashboardLayout>;

  const isOwn = userId === authUser?.id;
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <DashboardLayout>
      <div className="grid lg:grid-cols-[320px_1fr] gap-8 max-w-[1100px]">
        {/* LEFT */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-7 h-fit lg:sticky lg:top-[88px]">
          <div className="text-center">
            <div className="inline-block"><Avatar name={fullName} size={80} avatarUrl={user.avatarUrl} /></div>
            <h1 className="text-white text-[22px] mt-4">{fullName}</h1>
            <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">{user.university}</p>
            <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">{user.major}</p>
          </div>
          <div className="border-t border-[#2A2A2A] my-5" />
          <div className="flex flex-wrap gap-2">{user.skills.map(s => <Tag key={s} small static>{s}</Tag>)}</div>
          <div className="border-t border-[#2A2A2A] my-5" />
          <div className="grid grid-cols-2 gap-3">
            {[[user.projectCount,"Projects"],[user.connectionCount,"Connections"]].map(([n,l]) => (
              <div key={l as string} className="bg-black rounded-[10px] p-3 text-center">
                <div className="text-white text-[18px] font-[Unbounded]">{n}</div>
                <div className="text-[#A1A1A1] text-[11px] font-[Proza_Libre] mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#2A2A2A] my-5" />
          {isOwn ? <Button variant="ghost" full onClick={() => setEditProfileOpen(true)}>Edit Profile</Button> : <Button full>Connect</Button>}
        </div>

        {/* RIGHT */}
        <div>
          <div className="flex gap-7 border-b border-[#2A2A2A]">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 text-[15px] font-[Proza_Libre] border-b-2 transition ${tab === t ? "border-white text-white" : "border-transparent text-[#A1A1A1] hover:text-white"}`}>{t}</button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "Projects" && (
              <div className="flex flex-col gap-4">
                {isOwn && (
                  <Button onClick={() => setCreateProjectOpen(true)} full>+ Add New Project</Button>
                )}
                {projects.length === 0 && <p className="text-[#A1A1A1] font-[Proza_Libre]">No projects yet.</p>}
                {projects.map(p => {
                  const role = p.captainId === user.id ? "Captain" : "Member";
                  return (
                    <div key={p.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-white text-[16px]">{p.name}</h3>
                        <span className="bg-[#2A2A2A] text-[#E2E2E2] rounded-[999px] px-3 py-1 text-[12px] font-[Proza_Libre]">{role}</span>
                      </div>
                      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mt-2 leading-[1.6]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>
                      <div className="flex mt-3">
                        {p.memberIds.slice(0, 5).map((id, i) => {
                          const m = connections.find(c => c.id === id) || (id === user.id ? user : null);
                          if (!m) return null;
                          return <div key={id} style={{ marginLeft: i ? -8 : 0 }} className="ring-2 ring-[#1A1A1A] rounded-full"><Avatar name={`${m.firstName} ${m.lastName}`} size={28} /></div>;
                        })}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">{p.skillsHave.slice(0,5).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="ghost" onClick={() => setDetailProject(p)}>View project →</Button>
                        {isOwn && p.captainId === user.id && <Button variant="ghost" onClick={() => setEditProject(p)}>Edit project</Button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "Connections" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.length === 0 && <p className="text-[#A1A1A1] font-[Proza_Libre]">No connections yet.</p>}
                {connections.map(c => {
                  const n = `${c.firstName} ${c.lastName}`;
                  return (
                    <div key={c.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[12px] p-4 text-center flex flex-col items-center">
                      <Avatar name={n} size={44} />
                      <div className="text-white text-[13px] font-[Unbounded] mt-2">{n}</div>
                      <div className="flex flex-wrap gap-1 justify-center mt-2">{c.skills.slice(0,3).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
                      <Button variant="ghost" full className="mt-3 !text-[12px] !py-2" onClick={() => navigate({ to: "/profile/$userId", params: { userId: c.id } })}>View Profile</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isOwn && (
        <EditProfileModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} user={user} onSaved={loadData} />
      )}

      {detailProject && (
        <ProjectDetailModal
          open={!!detailProject}
          onClose={() => setDetailProject(null)}
          project={detailProject}
          isCaptain={detailProject.captainId === authUser?.id}
          onConnect={() => { const p = detailProject; setDetailProject(null); setConnectProject(p); }}
          onEdit={() => { const p = detailProject; setDetailProject(null); setEditProject(p); }}
          members={detailProject.memberIds.map(id => {
            const m = connections.find(c => c.id === id) || (id === user.id ? user : null);
            return m ? { id: m.id, firstName: m.firstName, lastName: m.lastName } : null;
          }).filter(Boolean) as any[]}
        />
      )}

      {editProject && (
        <EditProjectModal
          open={!!editProject}
          onClose={() => setEditProject(null)}
          project={editProject}
          onSaved={loadData}
          onDeleted={loadData}
        />
      )}

      {isOwn && (
        <CreateProjectModal
          open={createProjectOpen}
          onClose={() => setCreateProjectOpen(false)}
          captainId={userId}
          onCreated={loadData}
        />
      )}

      {connectProject && (() => {
        const cap = connections.find(c => c.id === connectProject.captainId) || (connectProject.captainId === user.id ? user : null);
        return cap ? (
          <ConnectModal open={!!connectProject} onClose={() => setConnectProject(null)} projectName={connectProject.name} captainName={`${cap.firstName} ${cap.lastName}`} captainId={cap.id} />
        ) : null;
      })()}
    </DashboardLayout>
  );
}
