import { NextRequest, NextResponse } from "next/server";
import { Project } from "@/types";
import { RecommendationRequestSchema, ProjectSchema } from "@/lib/validation";
import { validateAndEnrichRepo, formatStars } from "@/lib/github";
import { getCachedResults, setCachedResults } from "@/lib/cache";
import { checkRateLimit, getClientIdentifier, getResetTime } from "@/lib/rate-limit";
import { Octokit } from "@octokit/rest";
import { z } from "zod";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Rate limit configuration - more generous since no AI costs
const RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000"), // 1 hour default
};

/**
 * Build GitHub search query based on user profile
 */
function buildSearchQuery(
  languages: string[],
  interests: string[],
  level: string
): string[] {
  const queries: string[] = [];

  // Base criteria based on skill level
  let baseCriteria = "";
  if (level === "beginner") {
    baseCriteria = "good-first-issues:>3 stars:>100 forks:>10";
  } else if (level === "intermediate") {
    baseCriteria = "stars:>500 forks:>50";
  } else {
    baseCriteria = "stars:>1000 forks:>100";
  }

  // Create queries for each language
  languages.slice(0, 3).forEach((lang) => {
    const langQuery = `language:${lang} ${baseCriteria} archived:false`;
    queries.push(langQuery);
  });

  // Add interest-based queries
  const interestKeywords: Record<string, string[]> = {
    "Web Dev": ["web", "frontend", "backend", "fullstack"],
    "Machine Learning": ["machine-learning", "ml", "ai", "deep-learning"],
    "DevTools": ["cli", "developer-tools", "productivity"],
    "CLI Tools": ["cli", "terminal", "command-line"],
    "Databases": ["database", "sql", "nosql"],
    "Security": ["security", "encryption", "auth"],
    "Mobile": ["mobile", "ios", "android", "react-native"],
    "Games": ["game", "gaming", "engine"],
    "Documentation": ["documentation", "docs"],
    "Infra / Cloud": ["cloud", "infrastructure", "devops", "kubernetes"],
    "Accessibility": ["accessibility", "a11y"],
    "Education": ["education", "learning", "tutorial"],
    "Compilers": ["compiler", "parser", "interpreter"],
    "Networking": ["network", "networking", "http"],
  };

  interests.slice(0, 2).forEach((interest) => {
    const keywords = interestKeywords[interest] || [];
    if (keywords.length > 0) {
      const topicQuery = keywords.map((k) => `topic:${k}`).join(" ");
      queries.push(`${topicQuery} ${baseCriteria} archived:false`);
    }
  });

  return queries;
}

/**
 * Generate a personalized "why" message
 */
function generateWhyMessage(
  repoName: string,
  description: string,
  level: string,
  hasGoodFirstIssues: boolean
): string {
  const messages = {
    beginner: hasGoodFirstIssues
      ? `Perfect for beginners! ${repoName} has labeled good first issues that will help you get started. The community is welcoming and you'll learn real-world development practices.`
      : `This project is well-maintained and popular, making it a safe choice for your first contributions. You'll learn from experienced maintainers and get helpful code reviews.`,
    intermediate: `You have the skills to make meaningful contributions here. ${repoName} will challenge you to grow while leveraging your existing experience. Your contributions will have real impact.`,
    expert: `This is a high-impact project where your expertise is needed. You can take on complex features, mentor others, and potentially become a core maintainer. Your contributions will benefit thousands of users.`,
  };

  return messages[level as keyof typeof messages] || messages.intermediate;
}

/**
 * Generate a specific first step suggestion
 */
function generateFirstStep(level: string, hasGoodFirstIssues: boolean): string {
  if (level === "beginner") {
    return hasGoodFirstIssues
      ? "Start by browsing the 'good first issue' labels, pick one that interests you, and comment that you'd like to work on it. Read the contributing guidelines first!"
      : "Read through the README and CONTRIBUTING.md, then look for issues labeled 'help wanted' or 'documentation'. Documentation improvements are great first contributions!";
  } else if (level === "intermediate") {
    return "Review open issues and pull requests to understand current priorities. Look for issues labeled 'help wanted' or areas where your expertise in the tech stack can add value.";
  } else {
    return "Review the project roadmap and architectural decisions. Consider tackling complex issues, proposing new features, or helping with code reviews and mentoring new contributors.";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      const resetTime = getResetTime(rateLimitResult.reset);
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can make ${rateLimitResult.limit} requests per hour. Try again in ${resetTime} seconds.`,
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": resetTime.toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const profile = RecommendationRequestSchema.parse(body);

    // Check cache first
    const cached = getCachedResults(profile);
    if (cached) {
      return NextResponse.json(
        { projects: cached, cached: true },
        {
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Build search queries
    const queries = buildSearchQuery(profile.languages, profile.interests, profile.level);

    // Search GitHub for repos
    const searchPromises = queries.map(async (query) => {
      try {
        const { data } = await octokit.search.repos({
          q: query,
          sort: "stars",
          order: "desc",
          per_page: 5,
        });
        return data.items;
      } catch (error) {
        console.error("GitHub search error:", error);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    const allRepos = searchResults.flat();

    // Remove duplicates by repo full_name
    const uniqueRepos = Array.from(
      new Map(allRepos.map((repo) => [repo.full_name, repo])).values()
    );

    // Take top 5 unique repos
    const topRepos = uniqueRepos.slice(0, 5);

    // Convert to our Project format and enrich
    const projectPromises = topRepos.map(async (repo) => {
      const repoData = await validateAndEnrichRepo(repo.full_name);

      const project: Project = {
        name: repo.name,
        repo: repo.full_name,
        description: repo.description || "No description available",
        why: generateWhyMessage(
          repo.name,
          repo.description || "",
          profile.level,
          repoData?.hasGoodFirstIssues || false
        ),
        firstStep: generateFirstStep(
          profile.level,
          repoData?.hasGoodFirstIssues || false
        ),
        difficulty: profile.level as any,
        stars: repoData ? formatStars(repoData.stars) : formatStars(repo.stargazers_count),
        language: repoData?.language || repo.language || "Unknown",
        tags: repoData?.topics || repo.topics || [],
        openIssues: repoData?.openIssues || repo.open_issues_count,
        hasGoodFirstIssues: repoData?.hasGoodFirstIssues || false,
        isActive: repoData?.isActive !== false,
        lastPushDate: repoData?.lastPushDate || repo.pushed_at,
      };

      return project;
    });

    const projects = await Promise.all(projectPromises);

    // Filter out inactive projects
    const validProjects = projects.filter((p) => p.isActive !== false);

    // Cache results
    setCachedResults(profile, validProjects);

    return NextResponse.json(
      { projects: validProjects },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (err) {
    console.error("API error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
