import { UserProfile, Project } from "@/types";

const STORAGE_KEYS = {
  PROFILE: "oss_compass_profile",
  HISTORY: "oss_compass_history",
  BOOKMARKS: "oss_compass_bookmarks",
} as const;

export interface SearchHistory {
  profile: UserProfile;
  projects: Project[];
  timestamp: number;
}

// Profile Storage
export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Failed to load profile:", error);
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
}

// Search History
export function saveSearchToHistory(
  profile: UserProfile,
  projects: Project[]
): void {
  if (typeof window === "undefined") return;
  try {
    const history = getSearchHistory();
    const newEntry: SearchHistory = {
      profile,
      projects,
      timestamp: Date.now(),
    };
    
    // Keep last 5 searches
    const updated = [newEntry, ...history].slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

export function getSearchHistory(): SearchHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to load search history:", error);
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

// Bookmarks
export function addBookmark(project: Project): void {
  if (typeof window === "undefined") return;
  try {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((p) => p.repo === project.repo);
    if (!exists) {
      bookmarks.push(project);
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    }
  } catch (error) {
    console.error("Failed to add bookmark:", error);
  }
}

export function removeBookmark(repoSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter((p) => p.repo !== repoSlug);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove bookmark:", error);
  }
}

export function getBookmarks(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to load bookmarks:", error);
    return [];
  }
}

export function isBookmarked(repoSlug: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((p) => p.repo === repoSlug);
}

export function clearAllStorage(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
