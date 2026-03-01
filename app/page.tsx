"use client";

import { useState, useEffect } from "react";
import { UserProfile, Project, SkillLevel } from "@/types";
import { LANGUAGES, INTERESTS } from "@/lib/constants";
import { SkillLevelPicker } from "@/components/SkillLevelPicker";
import { ChipSelector } from "@/components/ChipSelector";
import { ProjectCard } from "@/components/ProjectCard";
import { StepIndicator } from "@/components/StepIndicator";
import {
  saveProfile,
  loadProfile,
  saveSearchToHistory,
  addBookmark,
  removeBookmark,
  isBookmarked,
} from "@/lib/storage";

type AppState = "form" | "loading" | "results";
type SortOption = "relevance" | "stars" | "recent";

const STEP_LABELS = ["Skill Level", "Languages", "Interests", "Done"];

const LOADING_MESSAGES = [
  "Scanning active GitHub repositories…",
  "Checking community health signals…",
  "Matching your skills to open issues…",
  "Evaluating project friendliness…",
  "Curating your perfect matches…",
];

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("form");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    level: "",
    languages: [],
    interests: [],
    bio: "",
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [bookmarkedRepos, setBookmarkedRepos] = useState<Set<string>>(new Set());
  const [rateLimit, setRateLimit] = useState<{
    limit: number;
    remaining: number;
    reset: number;
  } | null>(null);

  // Load saved profile on mount
  useEffect(() => {
    const saved = loadProfile();
    if (saved && saved.level) {
      setProfile(saved);
    }
  }, []);

  // Save profile whenever it changes
  useEffect(() => {
    if (profile.level) {
      saveProfile(profile);
    }
  }, [profile]);

  // Update bookmarks state
  useEffect(() => {
    const repos = new Set(projects.map((p) => p.repo).filter((r) => isBookmarked(r)));
    setBookmarkedRepos(repos);
  }, [projects]);

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Language filter
    if (filterLanguage !== "all") {
      filtered = filtered.filter((p) => p.language === filterLanguage);
    }

    // Sort
    if (sortBy === "stars") {
      filtered.sort((a, b) => {
        const aStars = parseFloat(a.stars.replace("k", "000"));
        const bStars = parseFloat(b.stars.replace("k", "000"));
        return bStars - aStars;
      });
    } else if (sortBy === "recent") {
      filtered.sort((a, b) => {
        if (!a.lastPushDate || !b.lastPushDate) return 0;
        return new Date(b.lastPushDate).getTime() - new Date(a.lastPushDate).getTime();
      });
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, sortBy, filterLanguage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== "form") return;

      if (e.key === "Enter" && !e.shiftKey) {
        if (step === 1 && canNext1) {
          e.preventDefault();
          setStep(2);
        } else if (step === 2 && canNext2) {
          e.preventDefault();
          setStep(3);
        } else if (step === 3 && canSubmit) {
          e.preventDefault();
          handleSubmit();
        }
      }

      if (e.key === "ArrowRight" && step < 3) {
        if ((step === 1 && canNext1) || (step === 2 && canNext2)) {
          e.preventDefault();
          setStep((s) => s + 1);
        }
      }

      if (e.key === "ArrowLeft" && step > 1) {
        e.preventDefault();
        setStep((s) => s - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appState, step, profile]);

  async function handleSubmit() {
    setAppState("loading");
    setError("");
    setLoadingMsgIdx(0);
    setLoadingProgress(0);

    // Loading message rotation
    const msgInterval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setLoadingProgress((p) => Math.min(p + 1, 95));
    }, 100);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      clearInterval(msgInterval);
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Extract rate limit headers
      const limit = res.headers.get("X-RateLimit-Limit");
      const remaining = res.headers.get("X-RateLimit-Remaining");
      const reset = res.headers.get("X-RateLimit-Reset");
      
      if (limit && remaining && reset) {
        setRateLimit({
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          reset: parseInt(reset),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "API error");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setProjects(data.projects);
      saveSearchToHistory(profile, data.projects);
      
      // Slight delay to show 100% before transition
      setTimeout(() => {
        setAppState("results");
      }, 300);
    } catch (err) {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      setAppState("form");
      setStep(3);
    }
  }

  function restart() {
    setProfile({ level: "", languages: [], interests: [], bio: "" });
    setProjects([]);
    setFilteredProjects([]);
    setSearchQuery("");
    setSortBy("relevance");
    setFilterLanguage("all");
    setStep(1);
    setError("");
    setAppState("form");
    setLoadingProgress(0);
  }

  function toggleBookmark(project: Project) {
    if (bookmarkedRepos.has(project.repo)) {
      removeBookmark(project.repo);
      setBookmarkedRepos((prev) => {
        const next = new Set(prev);
        next.delete(project.repo);
        return next;
      });
    } else {
      addBookmark(project);
      setBookmarkedRepos((prev) => new Set(prev).add(project.repo));
    }
  }

  const canNext1 = !!profile.level;
  const canNext2 = profile.languages.length > 0;
  const canSubmit = profile.interests.length > 0;

  const projectLanguages = ["all", ...new Set(projects.map((p) => p.language))];

  // ─── Loading Screen ────────────────────────────────────────────────────
  if (appState === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-6" />
          <h2 className="font-bold text-slate-900 text-lg mb-2">Finding your matches</h2>
          <p className="text-slate-500 text-sm transition-all duration-300 mb-4">
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{loadingProgress}%</p>

          <div className="flex justify-center gap-1 mt-6">
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === loadingMsgIdx ? "bg-blue-600 scale-125" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ─── Results Screen ────────────────────────────────────────────────────
  if (appState === "results") {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Matches</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {filteredProjects.length} of {projects.length} projects
              </p>
            </div>
            <button onClick={restart} className="btn-secondary self-start sm:self-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start over
            </button>
          </div>

          {/* Profile summary */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-medium capitalize">
              {profile.level}
            </span>
            {profile.languages.slice(0, 3).map((l) => (
              <span key={l} className="text-xs bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1.5 rounded-full">
                {l}
              </span>
            ))}
            {profile.languages.length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
                +{profile.languages.length - 3} more
              </span>
            )}
          </div>

          {/* Filters and search */}
          <div className="card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Language filter */}
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {projectLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "all" ? "All Languages" : lang}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="relevance">Relevance</option>
                <option value="stars">Most Stars</option>
                <option value="recent">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Project cards */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No projects match your filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterLanguage("all");
                  setSortBy("relevance");
                }}
                className="text-blue-600 text-sm mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project, i) => (
                <ProjectCard
                  key={i}
                  project={project}
                  index={i}
                  isBookmarked={bookmarkedRepos.has(project.repo)}
                  onToggleBookmark={() => toggleBookmark(project)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <p className="text-xs text-slate-400">
              Projects are AI-curated and validated with GitHub. Always verify activity before contributing.
            </p>
            {rateLimit && (
              <p className="text-xs text-slate-400 mt-1">
                {rateLimit.remaining} of {rateLimit.limit} AI requests remaining this hour
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ─── Form Screen ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-xl mx-auto w-full px-4 py-10 flex-1 flex flex-col">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Smart GitHub Search
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find your OSS home</h1>
          <p className="text-slate-500 text-sm">
            Answer 3 quick questions and we'll find open source projects that actually match your skills.
          </p>
        </div>

        <StepIndicator current={step} total={3} labels={STEP_LABELS.slice(0, 3)} />

        {/* Step 1 – Skill Level */}
        {step === 1 && (
          <div className="card p-6 animate-slide-up">
            <h2 className="font-semibold text-slate-900 mb-1">How experienced are you with open source?</h2>
            <p className="text-slate-500 text-sm mb-5">Be honest — it helps us match you to the right projects.</p>
            <SkillLevelPicker
              selected={profile.level}
              onSelect={(level: SkillLevel) => setProfile((p) => ({ ...p, level }))}
            />
            <div className="mt-6 flex justify-end">
              <button
                className="btn-primary"
                disabled={!canNext1}
                onClick={() => setStep(2)}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 – Languages */}
        {step === 2 && (
          <div className="card p-6 animate-slide-up">
            <h2 className="font-semibold text-slate-900 mb-1">Which languages do you know?</h2>
            <p className="text-slate-500 text-sm mb-5">Pick all that apply — even ones you're still learning.</p>
            <ChipSelector
              options={LANGUAGES}
              selected={profile.languages}
              onToggle={(val) => setProfile((p) => ({ ...p, languages: toggle(p.languages, val) }))}
            />
            {profile.languages.length > 0 && (
              <p className="text-xs text-blue-600 font-medium mt-3">
                {profile.languages.length} selected
              </p>
            )}
            <div className="mt-6 flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button className="btn-primary" disabled={!canNext2} onClick={() => setStep(3)}>
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3 – Interests + Bio */}
        {step === 3 && (
          <div className="card p-6 animate-slide-up">
            <h2 className="font-semibold text-slate-900 mb-1">What kind of work excites you?</h2>
            <p className="text-slate-500 text-sm mb-5">Choose the areas you'd love to contribute to.</p>
            <ChipSelector
              options={INTERESTS}
              selected={profile.interests}
              onToggle={(val) => setProfile((p) => ({ ...p, interests: toggle(p.interests, val) }))}
            />
            {profile.interests.length > 0 && (
              <p className="text-xs text-blue-600 font-medium mt-3">
                {profile.interests.length} selected
              </p>
            )}

            <div className="mt-5 border-t border-slate-100 pt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Anything else? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                rows={3}
                placeholder="e.g. I want to improve my Rust skills, I care about accessibility, I only have a few hours a week…"
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Rate limit warning */}
            {rateLimit && rateLimit.remaining <= 2 && rateLimit.remaining > 0 && (
              <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Warning: Only {rateLimit.remaining} AI request{rateLimit.remaining === 1 ? '' : 's'} remaining this hour.
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
                Find my projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Built for open source communities · Powered by GitHub API
          </p>
          {rateLimit && (
            <p className="text-xs text-slate-400 mt-1">
              {rateLimit.remaining} of {rateLimit.limit} AI requests remaining this hour
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
