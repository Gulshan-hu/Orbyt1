import { supabase } from "@/integrations/supabase/client";
import { relativeTime } from "./constants";

export interface OrbytUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  major: string;
  avatarUrl?: string;
  averageRating: number;
  skills: string[];
  projectCount: number;
  connectionCount: number;
  matchScore?: number;
}

export interface OrbytProject {
  id: string;
  captainId: string;
  name: string;
  description: string;
  projectLink?: string;
  status: 'looking_for_team' | 'in_progress' | 'done';
  createdAt: string;
  skillsHave: string[];
  skillsNeed: { skill: string; note?: string }[];
  memberIds: string[];
  matchScore?: number;
}

export interface OrbytRating {
  id: string;
  fromUserId: string;
  toUserId: string;
  projectId: string;
  overallScore: number;
  communication: number;
  timeliness: number;
  technicalSkill: number;
  teamwork: number;
  comment: string;
  createdAt: string;
}

export interface OrbytProjectReview {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewerName: string;
  reviewText: string;
  createdAt: string;
}

export interface OrbytTeammateReview {
  id: string;
  projectId: string;
  fromUserId: string;
  toUserId: string;
  communication: number;
  timeliness: number;
  technicalSkill: number;
  teamwork: number;
  comment: string;
  createdAt: string;
}

export interface OrbytPendingRequest {
  id: string;
  fromUser: OrbytUser;
  projectId: string | null;
  projectName: string | null;
  message: string | null;
  createdAt: string;
}

// ---------- Loaders ----------

async function loadAllSkillsByUser() {
  const { data } = await supabase.from("user_skills").select("user_id, skill");
  const map = new Map<string, string[]>();
  for (const r of data ?? []) {
    const arr = map.get(r.user_id) ?? [];
    arr.push(r.skill);
    map.set(r.user_id, arr);
  }
  return map;
}

async function loadProjectMembers() {
  const { data } = await supabase.from("project_members").select("project_id, user_id");
  const byProject = new Map<string, string[]>();
  const byUser = new Map<string, string[]>();
  for (const r of data ?? []) {
    const a = byProject.get(r.project_id) ?? [];
    a.push(r.user_id);
    byProject.set(r.project_id, a);
    const b = byUser.get(r.user_id) ?? [];
    b.push(r.project_id);
    byUser.set(r.user_id, b);
  }
  return { byProject, byUser };
}

async function loadProjectSkills() {
  const [haveRes, needRes] = await Promise.all([
    supabase.from("project_skills_have").select("project_id, skill"),
    supabase.from("project_skills_need").select("project_id, skill, note"),
  ]);
  const have = new Map<string, string[]>();
  for (const r of haveRes.data ?? []) {
    const a = have.get(r.project_id) ?? [];
    a.push(r.skill);
    have.set(r.project_id, a);
  }
  const need = new Map<string, { skill: string; note?: string }[]>();
  for (const r of needRes.data ?? []) {
    const a = need.get(r.project_id) ?? [];
    a.push({ skill: r.skill, note: r.note ?? undefined });
    need.set(r.project_id, a);
  }
  return { have, need };
}

function rowToUser(row: any, skills: string[], projectIds: string[], connectionCount: number): OrbytUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    university: row.university,
    major: row.major,
    avatarUrl: row.avatar_url ?? undefined,
    averageRating: Number(row.average_rating) || 0,
    skills,
    projectCount: projectIds.length,
    connectionCount,
  };
}

function rowToProject(row: any, have: string[], need: { skill: string; note?: string }[], memberIds: string[]): OrbytProject {
  // Ensure captain is included in memberIds
  const allMembers = memberIds.includes(row.captain_id) ? memberIds : [row.captain_id, ...memberIds];
  return {
    id: row.id,
    captainId: row.captain_id,
    name: row.name,
    description: row.description,
    projectLink: row.project_link ?? undefined,
    status: row.status || 'looking_for_team',
    createdAt: relativeTime(row.created_at),
    skillsHave: have,
    skillsNeed: need,
    memberIds: allMembers,
  };
}

export async function fetchAllUsers(): Promise<OrbytUser[]> {
  const [{ data: users }, skills, members, { count: _ }] = await Promise.all([
    supabase.from("users").select("*"),
    loadAllSkillsByUser(),
    loadProjectMembers(),
    Promise.resolve({ count: 0 }),
  ]);
  // Connection counts per user
  const { data: conns } = await supabase.from("connections").select("user_a, user_b");
  const cc = new Map<string, number>();
  for (const c of conns ?? []) {
    cc.set(c.user_a, (cc.get(c.user_a) ?? 0) + 1);
    cc.set(c.user_b, (cc.get(c.user_b) ?? 0) + 1);
  }
  return (users ?? []).map(u => rowToUser(u, skills.get(u.id) ?? [], members.byUser.get(u.id) ?? [], cc.get(u.id) ?? 0));
}

export async function fetchUser(id: string): Promise<OrbytUser | null> {
  const { data: row } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (!row) return null;
  const [{ data: sk }, { data: pm }, { data: conns }] = await Promise.all([
    supabase.from("user_skills").select("skill").eq("user_id", id),
    supabase.from("project_members").select("project_id").eq("user_id", id),
    supabase.from("connections").select("user_a, user_b").or(`user_a.eq.${id},user_b.eq.${id}`),
  ]);
  return rowToUser(
    row,
    (sk ?? []).map(s => s.skill),
    (pm ?? []).map(p => p.project_id),
    (conns ?? []).length,
  );
}

export async function fetchAllProjects(): Promise<OrbytProject[]> {
  const [{ data: rows }, members, ps] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    loadProjectMembers(),
    loadProjectSkills(),
  ]);
  return (rows ?? []).map(r => rowToProject(r, ps.have.get(r.id) ?? [], ps.need.get(r.id) ?? [], members.byProject.get(r.id) ?? []));
}

export async function fetchProjectsForUser(userId: string): Promise<OrbytProject[]> {
  // Projects where user is captain OR member
  const { data: pmRows } = await supabase.from("project_members").select("project_id").eq("user_id", userId);
  const memberProjectIds = (pmRows ?? []).map(r => r.project_id);
  const { data: rows } = await supabase
    .from("projects")
    .select("*")
    .or(`captain_id.eq.${userId}${memberProjectIds.length ? `,id.in.(${memberProjectIds.join(",")})` : ""}`)
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];
  const ids = rows.map(r => r.id);
  const [{ data: have }, { data: need }, { data: members }] = await Promise.all([
    supabase.from("project_skills_have").select("project_id, skill").in("project_id", ids),
    supabase.from("project_skills_need").select("project_id, skill, note").in("project_id", ids),
    supabase.from("project_members").select("project_id, user_id").in("project_id", ids),
  ]);
  const haveMap = new Map<string, string[]>();
  for (const r of have ?? []) { const a = haveMap.get(r.project_id) ?? []; a.push(r.skill); haveMap.set(r.project_id, a); }
  const needMap = new Map<string, { skill: string; note?: string }[]>();
  for (const r of need ?? []) { const a = needMap.get(r.project_id) ?? []; a.push({ skill: r.skill, note: r.note ?? undefined }); needMap.set(r.project_id, a); }
  const memMap = new Map<string, string[]>();
  for (const r of members ?? []) { const a = memMap.get(r.project_id) ?? []; a.push(r.user_id); memMap.set(r.project_id, a); }
  return rows.map(r => rowToProject(r, haveMap.get(r.id) ?? [], needMap.get(r.id) ?? [], memMap.get(r.id) ?? []));
}

export async function fetchConnectionsForUser(userId: string): Promise<OrbytUser[]> {
  const { data: conns } = await supabase
    .from("connections")
    .select("user_a, user_b")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  const otherIds = (conns ?? []).map(c => c.user_a === userId ? c.user_b : c.user_a);
  if (!otherIds.length) return [];
  const { data: users } = await supabase.from("users").select("*").in("id", otherIds);
  const skills = await loadAllSkillsByUser();
  const members = await loadProjectMembers();
  const { data: allConns } = await supabase.from("connections").select("user_a, user_b");
  const cc = new Map<string, number>();
  for (const c of allConns ?? []) {
    cc.set(c.user_a, (cc.get(c.user_a) ?? 0) + 1);
    cc.set(c.user_b, (cc.get(c.user_b) ?? 0) + 1);
  }
  return (users ?? []).map(u => rowToUser(u, skills.get(u.id) ?? [], members.byUser.get(u.id) ?? [], cc.get(u.id) ?? 0));
}

export async function fetchPendingRequests(toUserId: string): Promise<OrbytPendingRequest[]> {
  const { data: reqs } = await supabase
    .from("connection_requests")
    .select("*")
    .eq("to_user_id", toUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (!reqs?.length) return [];
  const userIds = [...new Set(reqs.map(r => r.from_user_id))];
  const projectIds = reqs.map(r => r.project_id).filter(Boolean) as string[];
  const [{ data: users }, { data: projs }, skills, members] = await Promise.all([
    supabase.from("users").select("*").in("id", userIds),
    projectIds.length ? supabase.from("projects").select("id, name").in("id", projectIds) : Promise.resolve({ data: [] as any[] }),
    loadAllSkillsByUser(),
    loadProjectMembers(),
  ]);
  const userMap = new Map((users ?? []).map(u => [u.id, u]));
  const projMap = new Map((projs ?? []).map((p: any) => [p.id, p.name]));
  const { data: allConns } = await supabase.from("connections").select("user_a, user_b");
  const cc = new Map<string, number>();
  for (const c of allConns ?? []) {
    cc.set(c.user_a, (cc.get(c.user_a) ?? 0) + 1);
    cc.set(c.user_b, (cc.get(c.user_b) ?? 0) + 1);
  }
  return reqs.map(r => {
    const u = userMap.get(r.from_user_id)!;
    return {
      id: r.id,
      fromUser: rowToUser(u, skills.get(u.id) ?? [], members.byUser.get(u.id) ?? [], cc.get(u.id) ?? 0),
      projectId: r.project_id,
      projectName: r.project_id ? projMap.get(r.project_id) ?? null : null,
      message: r.message,
      createdAt: relativeTime(r.created_at),
    };
  });
}

export async function fetchRatingsForUser(userId: string): Promise<OrbytRating[]> {
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(r => ({
    id: r.id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    projectId: r.project_id,
    overallScore: r.overall_score,
    communication: r.communication,
    timeliness: r.timeliness,
    technicalSkill: r.technical_skill,
    teamwork: r.teamwork,
    comment: r.comment,
    createdAt: relativeTime(r.created_at),
  }));
}

// ---------- Mutations ----------

export async function createProjectWithSkills(args: {
  captainId: string;
  name: string;
  description: string;
  projectLink?: string;
  have: string[];
  need: { skill: string; note?: string }[];
}) {
  const { data: proj, error } = await supabase
    .from("projects")
    .insert({
      captain_id: args.captainId,
      name: args.name,
      description: args.description,
      project_link: args.projectLink ?? null,
    })
    .select()
    .single();
  if (error || !proj) throw error;
  const tasks: Promise<any>[] = [];
  if (args.have.length) tasks.push(supabase.from("project_skills_have").insert(args.have.map(s => ({ project_id: proj.id, skill: s }))));
  if (args.need.length) tasks.push(supabase.from("project_skills_need").insert(args.need.map(n => ({ project_id: proj.id, skill: n.skill, note: n.note ?? null }))));
  tasks.push(supabase.from("project_members").insert({ project_id: proj.id, user_id: args.captainId }));
  await Promise.all(tasks);
  return proj.id as string;
}

export async function updateProject(id: string, args: {
  name: string;
  description: string;
  projectLink?: string;
  have: string[];
  need: { skill: string; note?: string }[];
}) {
  await supabase.from("projects").update({
    name: args.name,
    description: args.description,
    project_link: args.projectLink ?? null,
  }).eq("id", id);
  await supabase.from("project_skills_have").delete().eq("project_id", id);
  await supabase.from("project_skills_need").delete().eq("project_id", id);
  if (args.have.length) await supabase.from("project_skills_have").insert(args.have.map(s => ({ project_id: id, skill: s })));
  if (args.need.length) await supabase.from("project_skills_need").insert(args.need.map(n => ({ project_id: id, skill: n.skill, note: n.note ?? null })));
}

export async function deleteProject(id: string) {
  await supabase.from("projects").delete().eq("id", id);
}

export async function updateUserProfile(id: string, args: {
  first_name: string;
  last_name: string;
  university: string;
  major: string;
  skills: string[];
  avatar_url?: string | null;
}) {
  await supabase.from("users").update({
    first_name: args.first_name,
    last_name: args.last_name,
    university: args.university,
    major: args.major,
    avatar_url: args.avatar_url,
  }).eq("id", id);
  await supabase.from("user_skills").delete().eq("user_id", id);
  if (args.skills.length) await supabase.from("user_skills").insert(args.skills.map(s => ({ user_id: id, skill: s })));
}

export async function setUserSkills(userId: string, skills: string[]) {
  await supabase.from("user_skills").delete().eq("user_id", userId);
  if (skills.length) await supabase.from("user_skills").insert(skills.map(s => ({ user_id: userId, skill: s })));
}

export async function sendConnectionRequest(args: { fromUserId: string; toUserId: string; projectId?: string | null; message?: string }) {
  const { error } = await supabase.from("connection_requests").insert({
    from_user_id: args.fromUserId,
    to_user_id: args.toUserId,
    project_id: args.projectId ?? null,
    message: args.message ?? null,
  });
  if (error) throw error;
}

export async function acceptConnectionRequest(reqId: string, fromUserId: string, toUserId: string, projectId: string | null) {
  await supabase.from("connection_requests").update({ status: "accepted" }).eq("id", reqId);
  const [a, b] = [fromUserId, toUserId].sort();
  await supabase.from("connections").insert({ user_a: a, user_b: b, project_id: projectId });
}

export async function rejectConnectionRequest(reqId: string) {
  await supabase.from("connection_requests").update({ status: "rejected" }).eq("id", reqId);
}

export async function fetchFriendsForUser(userId: string): Promise<OrbytUser[]> {
  const { data: friendRows } = await supabase
    .from("friends")
    .select("user_a, user_b")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (!friendRows || friendRows.length === 0) return [];

  const friendIds = friendRows.map(f => f.user_a === userId ? f.user_b : f.user_a);

  const [{ data: users }, { data: skills }] = await Promise.all([
    supabase.from("users").select("*").in("id", friendIds),
    supabase.from("user_skills").select("user_id, skill").in("user_id", friendIds),
  ]);

  const skillsMap = (skills ?? []).reduce((acc: Record<string, string[]>, s: any) => {
    if (!acc[s.user_id]) acc[s.user_id] = [];
    acc[s.user_id].push(s.skill);
    return acc;
  }, {});

  return (users ?? []).map((u: any) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    university: u.university,
    major: u.major,
    avatarUrl: u.avatar_url,
    averageRating: u.average_rating,
    skills: skillsMap[u.id] || [],
    projectCount: 0,
    connectionCount: 0,
  }));
}

export async function submitRating(args: {
  fromUserId: string;
  toUserId: string;
  projectId: string;
  overall: number;
  communication: number;
  timeliness: number;
  technicalSkill: number;
  teamwork: number;
  comment: string;
}) {
  const { error } = await supabase.from("ratings").insert({
    from_user_id: args.fromUserId,
    to_user_id: args.toUserId,
    project_id: args.projectId,
    overall_score: args.overall,
    communication: args.communication,
    timeliness: args.timeliness,
    technical_skill: args.technicalSkill,
    teamwork: args.teamwork,
    comment: args.comment,
  });
  if (error) throw error;
}

export async function updateProjectStatus(projectId: string, status: 'looking_for_team' | 'in_progress' | 'done') {
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw error;
}

export async function submitProjectReview(projectId: string, reviewerId: string, reviewText: string) {
  const { error } = await supabase.from("project_reviews").insert({
    project_id: projectId,
    reviewer_id: reviewerId,
    review_text: reviewText,
  });
  if (error) throw error;
}

export async function submitTeammateReview(args: {
  projectId: string;
  fromUserId: string;
  toUserId: string;
  communication: number;
  timeliness: number;
  technicalSkill: number;
  teamwork: number;
  comment: string;
}) {
  const { error } = await supabase.from("teammate_reviews").insert({
    project_id: args.projectId,
    from_user_id: args.fromUserId,
    to_user_id: args.toUserId,
    communication: args.communication,
    timeliness: args.timeliness,
    technical_skill: args.technicalSkill,
    teamwork: args.teamwork,
    comment: args.comment,
  });
  if (error) throw error;
}

export async function fetchProjectReviews(projectId: string): Promise<OrbytProjectReview[]> {
  const { data } = await supabase
    .from("project_reviews")
    .select("*, users!reviewer_id(first_name, last_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    reviewerId: r.reviewer_id,
    reviewerName: `${r.users.first_name} ${r.users.last_name}`,
    reviewText: r.review_text,
    createdAt: relativeTime(r.created_at),
  }));
}

export async function fetchCompletedProjects(): Promise<OrbytProject[]> {
  const [{ data: rows }, members, ps] = await Promise.all([
    supabase.from("projects").select("*").eq("status", "done").eq("in_showcase", true).order("created_at", { ascending: false }),
    loadProjectMembers(),
    loadProjectSkills(),
  ]);
  return (rows ?? []).map(r => rowToProject(r, ps.have.get(r.id) ?? [], ps.need.get(r.id) ?? [], members.byProject.get(r.id) ?? []));
}

export async function addProjectToShowcase(projectId: string) {
  const { error } = await supabase.from("projects").update({ in_showcase: true }).eq("id", projectId);
  if (error) throw error;
}

// ---------- Matching ----------

export function projectMatchScore(myskills: string[], project: OrbytProject): number {
  if (!project.skillsNeed.length) return 0;
  const mine = new Set(myskills);

  // Calculate how many of the project's needed skills you have
  const matchedNeeds = project.skillsNeed.filter(n => mine.has(n.skill)).length;

  // Higher score if you match more of what they need
  const needScore = (matchedNeeds / project.skillsNeed.length) * 100;

  // Bonus: if you have skills they already have (can contribute more)
  const haveSet = new Set(project.skillsHave);
  const matchedHave = myskills.filter(s => haveSet.has(s)).length;
  const haveBonus = project.skillsHave.length > 0 ? (matchedHave / project.skillsHave.length) * 20 : 0;

  // Weighted score: 80% based on needed skills, 20% bonus for matching existing skills
  return Math.min(100, Math.round(needScore * 0.8 + haveBonus));
}

export function userMatchScore(myskills: string[], otherSkills: string[]): number {
  if (!otherSkills.length || !myskills.length) return 0;

  const mine = new Set(myskills);
  const theirs = new Set(otherSkills);

  // Skills they have that you don't (complementary - they can teach you)
  const complementary = otherSkills.filter(s => !mine.has(s)).length;

  // Skills you both have (common ground - easier collaboration)
  const overlap = otherSkills.filter(s => mine.has(s)).length;

  // Balanced score: 60% complementary (diversity), 40% overlap (common ground)
  const complementaryScore = (complementary / otherSkills.length) * 60;
  const overlapScore = (overlap / otherSkills.length) * 40;

  return Math.round(complementaryScore + overlapScore);
}
