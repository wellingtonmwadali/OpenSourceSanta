import { SkillLevel } from "@/types";

export const SKILL_LEVELS: {
  id: SkillLevel;
  label: string;
  icon: string;
  desc: string;
  color: string;
}[] = [
  {
    id: "beginner",
    label: "Beginner",
    icon: "🌱",
    desc: "New to open source. Learning to navigate repos, issues, and pull requests.",
    color: "green",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    icon: "⚡",
    desc: "Made contributions before. Comfortable with the OSS workflow and code reviews.",
    color: "orange",
  },
  {
    id: "expert",
    label: "Expert",
    icon: "🔥",
    desc: "Deep expertise. Ready to take on architecture, mentoring, and ownership.",
    color: "red",
  },
];

export const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Rust", "Go",
  "Java", "C++", "Ruby", "Swift", "Kotlin", "PHP", "C#", "Scala", "Elixir",
];

export const INTERESTS = [
  "Web Dev", "Machine Learning", "DevTools", "CLI Tools", "Databases",
  "Security", "Mobile", "Games", "Documentation", "Infra / Cloud",
  "Accessibility", "Education", "Compilers", "Networking",
];

export const DIFFICULTY_STYLES: Record<SkillLevel, { badge: string; border: string }> = {
  beginner:     { badge: "bg-green-100 text-green-700",  border: "border-green-200" },
  intermediate: { badge: "bg-orange-100 text-orange-700", border: "border-orange-200" },
  expert:       { badge: "bg-red-100 text-red-700",      border: "border-red-200" },
};
