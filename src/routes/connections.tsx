import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Avatar } from "@/components/Avatar";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";
import { RatingModal } from "@/components/RatingModal";
import { useToast } from "@/components/Toast";
import { fetchConnectionsForUser, fetchPendingRequests, acceptConnectionRequest, rejectConnectionRequest, fetchAllProjects, fetchFriendsForUser, type OrbytUser, type OrbytPendingRequest } from "@/lib/data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/connections")({ component: ConnectionsPage });

const TABS = ["My Connections","Friends","Pending Requests"] as const;

function ConnectionsPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<typeof TABS[number]>("My Connections");
  const [pending, setPending] = useState<OrbytPendingRequest[]>([]);
  const [connections, setConnections] = useState<OrbytUser[]>([]);
  const [friends, setFriends] = useState<OrbytUser[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [rateFor, setRateFor] = useState<string | null>(null);
  const [rated, setRated] = useState<Set<string>>(new Set());

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/login" }); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [conns, friendsList, reqs, projs] = await Promise.all([
        fetchConnectionsForUser(user.id),
        fetchFriendsForUser(user.id),
        fetchPendingRequests(user.id),
        fetchAllProjects(),
      ]);
      setConnections(conns);
      setFriends(friendsList);
      setPending(reqs);
      setProjects(projs);
    };
    load();
  }, [user]);

  const handleAccept = async (req: OrbytPendingRequest) => {
    await acceptConnectionRequest(req.id, req.fromUser.id, user!.id, req.projectId);
    setConnections([...connections, req.fromUser]);
    setPending(pending.filter(p => p.id !== req.id));
    show("Connection accepted!");
  };

  const handleDecline = async (reqId: string) => {
    await rejectConnectionRequest(reqId);
    setPending(pending.filter(p => p.id !== reqId));
    show("Request declined");
  };

  return (
    <DashboardLayout>
      <h1 className="text-white text-[28px] mb-2">My Network</h1>
      <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">{connections.length} connections • {friends.length} friends</p>

      <div className="flex gap-7 border-b border-[#2A2A2A] mb-8">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-[15px] font-[Proza_Libre] border-b-2 transition ${tab === t ? "border-white text-white" : "border-transparent text-[#A1A1A1] hover:text-white"}`}>
            {t}{t === "Pending Requests" && pending.length > 0 && <span className="ml-1.5 text-[12px] bg-[#2A2A2A] rounded-full px-2 py-0.5">{pending.length}</span>}
          </button>
        ))}
      </div>

      {tab === "My Connections" && (
        <div>
          <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] mb-4">
            People you've connected with through connection requests
          </p>
          {connections.length === 0 ? (
            <p className="text-[#A1A1A1] font-[Proza_Libre]">No connections yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {connections.map(c => {
                const n = `${c.firstName} ${c.lastName}`;
                const sharedProject = projects.find(p => p.memberIds.includes(c.id) && user && p.memberIds.includes(user.id))?.name || projects[0]?.name || "Shared";
                const needsRating = !rated.has(c.id);
                return (
                  <div key={c.id} className={`bg-[#1A1A1A] rounded-[16px] p-6 border ${needsRating ? "border-[#E2E2E2]" : "border-[#2A2A2A]"}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={n} size={48} avatarUrl={c.avatarUrl} />
                      <div className="min-w-0">
                        <div className="text-white text-[15px] font-[Unbounded] truncate">{n}</div>
                        <div className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] truncate">{c.university}</div>
                      </div>
                    </div>
                    <p className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] mt-3">Project: <span className="text-white">{sharedProject}</span></p>
                    <div className="flex flex-wrap gap-1.5 mt-3">{c.skills.slice(0,4).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="ghost" full onClick={() => navigate({ to: "/profile/$userId", params: { userId: c.id } })}>Profile</Button>
                      <Button full onClick={() => setRateFor(c.id)}>{needsRating ? "Rate" : "Rated ✓"}</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "Friends" && (
        <div>
          <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] mb-4">
            People who became friends by collaborating on the same project
          </p>
          {friends.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-white text-[18px] mb-2">No friends yet</h3>
              <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">
                When you collaborate with others on projects, you'll automatically become friends
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {friends.map(f => {
                const n = `${f.firstName} ${f.lastName}`;
                return (
                  <div key={f.id} className="bg-[#1A1A1A] rounded-[16px] p-6 border border-[#2A2A2A] hover:border-[#E2E2E2] transition">
                    <div className="flex items-center gap-3">
                      <Avatar name={n} size={48} avatarUrl={f.avatarUrl} />
                      <div className="min-w-0">
                        <div className="text-white text-[15px] font-[Unbounded] truncate">{n}</div>
                        <div className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] truncate">{f.university}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[#A1A1A1] text-[12px] font-[Proza_Libre]">Project collaborator</span>
                      <span className="text-green-500">✓</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">{f.skills.slice(0,4).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
                    <div className="mt-4">
                      <Button variant="ghost" full onClick={() => navigate({ to: "/profile/$userId", params: { userId: f.id } })}>View Profile</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "Pending Requests" && (
        <div className="flex flex-col gap-4">
          {pending.length === 0 && <p className="text-[#A1A1A1] font-[Proza_Libre]">No pending requests.</p>}
          {pending.map(req => {
            const u = req.fromUser;
            const n = `${u.firstName} ${u.lastName}`;
            return (
              <div key={req.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6 flex flex-col md:flex-row gap-4 md:items-center">
                <Avatar name={n} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[15px] font-[Unbounded]">{n}</div>
                  <div className="text-[#A1A1A1] text-[13px] font-[Proza_Libre]">
                    wants to collaborate{req.projectName ? ` on ${req.projectName}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">{u.skills.slice(0,4).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
                  {req.message && <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] mt-3 italic">"{req.message}"</p>}
                </div>
                <div className="flex gap-2 md:flex-col">
                  <Button onClick={() => handleAccept(req)}>Accept</Button>
                  <Button variant="ghost" onClick={() => handleDecline(req.id)}>Decline</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rateFor && (() => {
        const u = connections.find(c => c.id === rateFor);
        if (!u) return null;
        return (
          <RatingModal
            open
            onClose={() => setRateFor(null)}
            name={`${u.firstName} ${u.lastName}`}
            projectName={projects[0]?.name || "Shared"}
            toUserId={u.id}
            projectId={projects[0]?.id}
            onSubmit={() => setRated(new Set([...rated, rateFor]))}
          />
        );
      })()}
    </DashboardLayout>
  );
}
