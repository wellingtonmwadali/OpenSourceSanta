import { UserProfile, Project } from "@/types";

interface CacheEntry {
  data: Project[];
  timestamp: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry>();

export function getCacheKey(profile: UserProfile): string {
  return JSON.stringify({
    level: profile.level,
    languages: [...profile.languages].sort(),
    interests: [...profile.interests].sort(),
    bio: profile.bio?.trim() || "",
  });
}

export function getCachedResults(profile: UserProfile): Project[] | null {
  const key = getCacheKey(profile);
  const entry = cache.get(key);

  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCachedResults(profile: UserProfile, projects: Project[]): void {
  const key = getCacheKey(profile);
  cache.set(key, {
    data: projects,
    timestamp: Date.now(),
  });

  // Limit cache size to 50 entries
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

export function clearCache(): void {
  cache.clear();
}
