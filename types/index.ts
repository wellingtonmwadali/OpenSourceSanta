export type SkillLevel = "beginner" | "intermediate" | "expert";

export interface UserProfile {
  level: SkillLevel | "";
  languages: string[];
  interests: string[];
  bio: string;
}

export interface Project {
  name: string;
  repo: string;
  description: string;
  why: string;
  firstStep: string;
  difficulty: SkillLevel;
  stars: string;
  language: string;
  tags: string[];
  openIssues?: number;
  hasGoodFirstIssues?: boolean;
  isActive?: boolean;
  lastPushDate?: string;
}
