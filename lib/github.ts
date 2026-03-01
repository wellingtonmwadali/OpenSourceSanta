import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface RepoData {
  stars: number;
  openIssues: number;
  hasGoodFirstIssues: boolean;
  lastPushDate: string;
  isActive: boolean;
  description: string | null;
  language: string | null;
  topics: string[];
  homepage: string | null;
}

export async function validateAndEnrichRepo(
  repoSlug: string
): Promise<RepoData | null> {
  try {
    const [owner, repo] = repoSlug.split("/");
    if (!owner || !repo) return null;

    const { data } = await octokit.repos.get({ owner, repo });

    // Check for good-first-issue labels
    const { data: labels } = await octokit.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });

    const hasGoodFirstIssues = labels.some(
      (label) =>
        label.name.toLowerCase().includes("good") &&
        label.name.toLowerCase().includes("first")
    );

    // Check if repo is active (pushed within last 3 months)
    const lastPush = new Date(data.pushed_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const isActive = lastPush > threeMonthsAgo;

    return {
      stars: data.stargazers_count,
      openIssues: data.open_issues_count,
      hasGoodFirstIssues,
      lastPushDate: data.pushed_at,
      isActive,
      description: data.description,
      language: data.language,
      topics: data.topics || [],
      homepage: data.homepage,
    };
  } catch (error) {
    console.error(`Failed to validate repo ${repoSlug}:`, error);
    return null;
  }
}

export async function searchRepos(query: string, language?: string) {
  try {
    const langQuery = language ? `language:${language}` : "";
    const { data } = await octokit.search.repos({
      q: `${query} ${langQuery} good-first-issues:>5 stars:>100`,
      sort: "stars",
      per_page: 10,
    });

    return data.items
      .filter((repo) => repo.owner)
      .map((repo) => ({
        name: repo.name,
        owner: repo.owner!.login,
        slug: repo.full_name,
        stars: repo.stargazers_count,
        description: repo.description,
        language: repo.language,
      }));
  } catch (error) {
    console.error("Failed to search repos:", error);
    return [];
  }
}

export function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
