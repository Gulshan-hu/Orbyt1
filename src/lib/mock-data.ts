// TEMPORARY shim: components are mid-migration to Supabase.
// Re-exports constants from the new location and exposes empty mock arrays
// so existing imports keep compiling until each route/component is rewritten
// to use src/lib/data.ts.
export { SKILL_CATEGORIES, UNIVERSITIES, MAJORS } from "./constants";

export interface MockProject {
  id: string;
  captainId: string;
  name: string;
  description: string;
  skillsHave: string[];
  skillsNeed: { skill: string; note?: string }[];
  githubLink?: string;
  createdAt: string;
  memberIds: string[];
  matchScore?: number;
}

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  major: string;
  skills: string[];
  averageRating: number;
  projectCount: number;
  connectionCount: number;
  projects: MockProject[];
  connections: string[];
  matchScore?: number;
}

export interface MockRating {
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

export const CURRENT_USER_ID = "";
export const mockUsers: MockUser[] = [];
export const mockProjects: MockProject[] = [];
export const mockRatings: MockRating[] = [];
export function getUserById(_id: string): MockUser | undefined { return undefined; }
export function getProjectById(_id: string): MockProject | undefined { return undefined; }
export function getRatingsForUser(_id: string): MockRating[] { return []; }
