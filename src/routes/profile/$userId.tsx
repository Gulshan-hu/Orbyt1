import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Avatar } from "@/components/Avatar";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";
import { RatingModal } from "@/components/RatingModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { EditProjectModal } from "@/components/EditProjectModal";
import { ConnectModal } from "@/components/ConnectModal";
import { fetchUser, fetchProjectsForUser, fetchConnectionsForUser, fetchRatingsForUser, type OrbytUser, type OrbytProject, type OrbytRating } from "@/lib/data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile/$userId")({ component: ProfilePage });

const TABS = ["Projects","Connections","Ratings"] as const;
const RATING_CATS = [["Communication","communication"],["Timeliness","timeliness"],["Technical Skill","technicalSkill"],["Teamwork","teamwork"]] as const;

function ProfilePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<typeof TABS[number]>("Projects");
  const [rateOpen, setRateOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<OrbytProject | null>(null);
  const [editProject, setEditProject] = useState<OrbytProject | null>(null);
  const [connectProject, setConnectProject] = useState<OrbytProject | null>(null);
  const [user, setUser] = useState<OrbytUser | null>(null);
  const [projects, setProjects] = useState<OrbytProject[]>([]);
  const [connections, setConnections] = useState<OrbytUser[]>([]);
  const [ratings, setRatings] = useState<OrbytRating[]>([]);

  useEffect(() => { if (!authLoading && !authUser) navigate({ to: "/login" }); }, [authUser, authLoading, navigate]);

  const loadData = async () => {
    const [userData, projectsData, connectionsData, ratingsData] = await Promise.all([
      fetchUser(userId),
      fetchProjectsForUser(userId),
      fetchConnectionsForUser(userId),
      fetchRatingsForUser(userId),
    ]);
    setUser(userData);
    setProjects(projectsData);
    setConnections(connectionsData);
    setRatings(ratingsData);
  };

  useEffect(() => {
    if (!authUser) return;
    loadData();
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
            <div className="inline-block"><Avatar name={fullName} size={80} /></div>
            <h1 className="text-white text-[22px] mt-4">{fullName}</h1>
            <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">{user.university}</p>
            <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">{user.major}</p>
          </div>
          <div className="border-t border-[#2A2A2A] my-5" />
          <div className="flex flex-wrap gap-2">{user.skills.map(s => <Tag key={s} small static>{s}</Tag>)}</div>
          <div className="border-t border-[#2A2A2A] my-5" />
          <div className="grid grid-cols-3 gap-3">
            {[[user.projectCount,"Projects"],[user.connectionCount,"Connections"],[`★ ${user.averageRating}`,"Rating"]].map(([n,l]) => (
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

            {tab === "Ratings" && (
              <div className="flex flex-col gap-4">
                {isOwn && connections[0] && (
                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-[12px] p-4 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">You haven't rated {connections[0].firstName} {connections[0].lastName} yet</span>
                    <Button onClick={() => setRateOpen(true)}>Rate Now</Button>
                  </div>
                )}
                {ratings.length === 0 && <p className="text-[#A1A1A1] font-[Proza_Libre]">No ratings yet.</p>}
                {ratings.map(r => {
                  const reviewer = connections.find(c => c.id === r.fromUserId);
                  const proj = projects.find(p => p.id === r.projectId);
                  if (!reviewer) return null;
                  const rn = `${reviewer.firstName} ${reviewer.lastName}`;
                  return (
                    <div key={r.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6">
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={rn} size={36} />
                          <div>
                            <div className="text-white text-[14px] font-[Proza_Libre]">{rn}</div>
                            <div className="text-[#A1A1A1] text-[12px] font-[Proza_Libre]">{r.createdAt}</div>
                          </div>
                        </div>
                        <div className="text-[16px]">{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= r.overallScore ? "#FFFFFF" : "#2A2A2A" }}>★</span>)}</div>
                      </div>
                      {proj && <span className="inline-block mt-3 border border-[#2A2A2A] rounded-[999px] px-2.5 py-0.5 text-[12px] text-[#A1A1A1] font-[Proza_Libre]">{proj.name} project</span>}
                      <div className="flex flex-col gap-2 mt-4">
                        {RATING_CATS.map(([label, key]) => {
                          const v = r[key as keyof typeof r] as number;
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] w-[120px]">{label}</span>
                              <div className="flex-1 h-1 bg-[#2A2A2A] rounded-[999px] overflow-hidden"><div className="h-full bg-white rounded-[999px]" style={{ width: `${(v / 5) * 100}%` }} /></div>
                              <span className="text-white text-[13px] font-[Proza_Libre] w-6 text-right">{v}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] leading-[1.6] mt-3.5">{r.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {connections[0] && (
        <RatingModal
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          name={`${connections[0].firstName} ${connections[0].lastName}`}
          projectName={projects[0]?.name || "Shared"}
          toUserId={connections[0].id}
          projectId={projects[0]?.id}
        />
      )}

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
            return m ? { id: m.id, firstName: m.firstName, lastName: m.lastName, averageRating: m.averageRating } : null;
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

      {connectProject && (() => {
        const cap = connections.find(c => c.id === connectProject.captainId) || (connectProject.captainId === user.id ? user : null);
        return cap ? (
          <ConnectModal open={!!connectProject} onClose={() => setConnectProject(null)} projectName={connectProject.name} captainName={`${cap.firstName} ${cap.lastName}`} captainId={cap.id} />
        ) : null;
      })()}
    </DashboardLayout>
  );
}
