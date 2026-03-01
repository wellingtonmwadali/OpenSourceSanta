"use client";

import { useState } from "react";
import { Project } from "@/types";
import { DIFFICULTY_STYLES } from "@/lib/constants";

interface Props {
  project: Project;
  index: number;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export function ProjectCard({ project, index, isBookmarked = false, onToggleBookmark }: Props) {
  const [expanded, setExpanded] = useState(false);
  const styles = DIFFICULTY_STYLES[project.difficulty] ?? DIFFICULTY_STYLES.beginner;

  return (
    <div
      className={`card transition-all duration-200 animate-slide-up ${
        expanded ? "shadow-md" : "hover:shadow-md"
      }`}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Number Badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-bold text-slate-900 text-base">{project.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
              {project.difficulty}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {project.stars}
            </span>
            {project.openIssues !== undefined && (
              <span className="text-xs text-slate-400">
                • {project.openIssues} open issues
              </span>
            )}
            {project.hasGoodFirstIssues && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                ✓ Good First Issues
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-2">{project.description}</p>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-mono font-medium">
              {project.language}
            </span>
            {project.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Bookmark & Expand Buttons */}
        <div className="flex items-start gap-2">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                  : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Bookmark project"}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4 animate-fade-in">
          {/* Why this project */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Why it's right for you</p>
              <p className="text-sm text-slate-700 leading-relaxed">{project.why}</p>
            </div>
          </div>

          {/* First step */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your first contribution</p>
              <p className="text-sm text-slate-700 leading-relaxed">{project.firstStep}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`https://github.com/${project.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs px-4 py-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
            <a
              href={`https://github.com/${project.repo}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs px-4 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Browse Issues
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
