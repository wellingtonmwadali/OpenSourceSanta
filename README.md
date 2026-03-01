# 🧭 OSS Compass

An AI-powered open source project discovery tool. Tell it your skill level, languages, and interests — it finds real GitHub projects that genuinely need contributors like you.

## ✨ Features

### 🎯 Smart Matching
- **AI-Powered Recommendations** — Claude analyzes your profile and suggests 5 tailored projects
- **GitHub Integration** — Real-time validation of repo activity, stars, and good-first-issues
- **Skill-Aware** — Different suggestions for beginners, intermediate, and expert contributors

### 🔍 Enhanced Discovery
- **Search & Filter** — Find projects by name, description, tags, or language
- **Smart Sorting** — Sort by relevance, stars, or recent activity
- **Good First Issues Badge** — Instantly identify beginner-friendly projects
- **Real Metrics** — Live data on stars, open issues, and repo health

### 💾 Persistence & Bookmarks
- **Auto-Save Profile** — Your preferences are remembered between visits
- **Search History** — Access your last 5 searches
- **Bookmark Projects** — Save favorites for later

### ⌨️ Great UX
- **Keyboard Navigation** — Use Enter/Arrow keys to navigate the form
- **Progress Bar** — Visual feedback during AI processing
- **Mobile Responsive** — Works beautifully on all devices
- **Animated Transitions** — Smooth, polished interactions

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. (Optional) Add GitHub token
```bash
cp .env.example .env.local
# Edit .env.local and add your token
```

**Highly recommended:**
- `GITHUB_TOKEN` — Personal access token for GitHub API (no scopes needed for public repos)
  - Get one at [github.com/settings/tokens](https://github.com/settings/tokens)
  - Enables repo validation, real-time metrics, and rate limit increases

### 3. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How it works

1. **Step 1** — Choose your experience level (Beginner / Intermediate / Expert)
2. **Step 2** — Select the languages you know
3. **Step 3** — Pick the areas that excite you
4. **Smart matching** — Intelligent GitHub search based on your profile
5. **GitHub validation** — Repos are verified and enriched with live data
6. **Smart results** — Filter, sort, search, and bookmark your matches

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **GitHub API** (via Octokit) - smart search & filtering
- **Zod** (validation)
- **No AI needed** - pure GitHub search

## Project Structure

```
oss-compass/
├── app/
│   ├── api/recommend/route.ts   # AI + GitHub API endpoint
│   ├── page.tsx                 # Main app with filtering & state
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── SkillLevelPicker.tsx
│   ├── ChipSelector.tsx
│   ├── ProjectCard.tsx          # With bookmarks & GitHub data
│   └── StepIndicator.tsx
├── lib/
│   ├── constants.ts
│   ├── validation.ts            # Zod schemas
│   ├── github.ts                # GitHub API utilities
│   ├── storage.ts               # localStorage helpers
│   ├── cache.ts                 # Request caching
│   └── rate-limit.ts            # Rate limiting utilities
└── types/
    └── index.ts
```

## Key Improvements

### 🚀 Performance
- **Request Caching** — Same profile = instant results (30min cache)
- **Parallel GitHub API Calls** — Fast repo enrichment
- **Rate Limiting** — 10 AI requests per hour per IP to control costs and prevent abuse

### 🔒 Reliability
- **Input Validation** — Zod schemas prevent bad data
- **Error Boundaries** — Graceful error handling with helpful messages
- **Repo Validation** — Filters out inactive or invalid projects
- **Rate Limit Display** — Users see remaining requests in real-time

### 🎨 UX Enhancements
- **Keyboard Shortcuts** — Enter to advance, arrows to navigate steps
- **Loading Progress** — Real-time progress bar with messages
- **Empty States** — Clear messaging when filters return no results
- **Mobile Optimized** — Touch-friendly with proper tap targets

## Contributing

Contributions are welcome! This project itself is a great place to practice OSS contributions.

## License

MIT
