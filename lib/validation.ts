import { z } from "zod";

export const SkillLevelSchema = z.enum(["beginner", "intermediate", "expert"]);

export const UserProfileSchema = z.object({
  level: z.union([SkillLevelSchema, z.literal("")]),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  bio: z.string().max(500, "Bio must be less than 500 characters"),
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  repo: z.string().regex(/^[\w-]+\/[\w-]+$/, "Invalid repo format"),
  description: z.string(),
  why: z.string(),
  firstStep: z.string(),
  difficulty: SkillLevelSchema,
  stars: z.string(),
  language: z.string(),
  tags: z.array(z.string()),
});

export const RecommendationRequestSchema = z.object({
  level: SkillLevelSchema,
  languages: z.array(z.string()).min(1),
  interests: z.array(z.string()).min(1),
  bio: z.string().optional(),
});

export const RecommendationResponseSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;
export type ValidatedProject = z.infer<typeof ProjectSchema>;
export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;
