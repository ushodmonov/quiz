# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # install dependencies
npm run dev              # Vite dev server on http://localhost:3000 (host: true, exposed on LAN)
npm run build            # tsc typecheck + vite build -> dist/
npm run preview          # serve the production build
npm run lint             # eslint, --max-warnings 0 (warnings fail)
npm run generate-catalog # scan public/assets/ and (re)write public/assets/test-catalog.json
```

There is no test runner configured. `npm run build` runs `tsc` first, so a build failure is usually a type error — typecheck with `npm run build` rather than a separate command.

## Architecture

A single-page React + TypeScript (Vite, MUI) quiz app, deployed to **GitHub Pages** and run primarily as a **Telegram Mini App**. There is no backend server — Firebase Firestore is the only remote dependency, used for JWT access tokens.

### Navigation
[src/App.tsx](src/App.tsx) is the root and the de-facto router: a `currentPage` state string (`'start' | 'test' | 'results' | 'questions' | 'formats' | 'admin-token' | 'admin-users'`) switch-renders pages from [src/pages/](src/pages/). There is **no react-router** — navigation is state plus a manual `#questions` hash listener for opening the all-questions view in a new tab. The single shared `quizData: QuizData` object (see [src/types/index.ts](src/types/index.ts)) carries all in-flight quiz state between pages and is mutated through the `handle*` callbacks in `App.tsx` (next test, retake-incorrect, complete, resume).

### Access control (Telegram + JWT)
The app gates content behind two checks in `App.tsx`:
1. **Telegram-only** — outside Telegram it renders a "use the Mini App" wall, unless browser dev mode is on (`isBrowserDevModeEnabled()` in [src/utils/storage.ts](src/utils/storage.ts)).
2. **JWT access token** — non-admin Telegram users must have a valid HMAC-SHA256 JWT. Tokens are minted by admins on [AdminTokenPage](src/pages/AdminTokenPage.tsx), stored in Firestore (`jwt_tokens` collection), fetched by `getJwtTokensByTelegramUserId`, verified client-side in [src/utils/jwt.ts](src/utils/jwt.ts) against `JWT_SECRET_KEY`, then cached in localStorage per user.

Admins are a hardcoded numeric allowlist (`ADMIN_TELEGRAM_USER_IDS` in [src/constants/contact.ts](src/constants/contact.ts)). **Note:** `JWT_SECRET_KEY` and the Firebase config live in that file client-side and are therefore public — this is access management, not real security. Keep that in mind before treating it as a trust boundary.

### Question parsing
[src/utils/fileParser.ts](src/utils/fileParser.ts) turns uploaded/fetched files into `Question[]`. It handles three sources — TXT, DOCX (via `mammoth`), XLSX (via `xlsx`) — and **auto-detects multiple text formats** within them:
- Classic: `# question`, `+ correct`, `- wrong` lines.
- New separator format: questions split by `++++`, options by `====`.
- Numbered format: `97. Question text` with lettered options.
- Special question kinds detected from Russian marker phrases: **sequence/ordering** (`порядок следования`) and **matching** (`соответствие`), which map to `isSequence` / `isMatching` on `Question` and use the `orderNumber` / `matchIndex` answer fields.
- Optional per-question `difficulty` (1/2/3).

When adding a format, extend the detection + branch in `fileParser.ts`; `fixEncoding()` runs first to repair Windows-1251/UTF-8 corruption common in these source files.

### Test catalog
[src/utils/testCatalog.ts](src/utils/testCatalog.ts) loads `public/assets/test-catalog.json` (a curated list of downloadable tests, supports nested `sub_catalogs` and Google Drive/Docs URLs as `path`). The catalog is **not committed** — generate it with `npm run generate-catalog` (which infers `subject`/`semester`/`courses`/`years` from file/folder names, see [scripts/generate-catalog.js](scripts/generate-catalog.js)) or copy from [example/test-catalog.json](example/test-catalog.json). Item `id` is auto-generated from `path`/`subject`/`name` if absent.

### Persistence layers
- **localStorage** ([src/utils/storage.ts](src/utils/storage.ts)) — current quiz progress, theme, language, the all-questions snapshot, cached JWTs. Because base64 image data (formula images) blows the quota, `saveProgress` strips `imageData` and progressively degrades (drop images → drop `allQuestions` → metadata only) on `QuotaExceededError`.
- **IndexedDB** ([src/utils/indexedDb.ts](src/utils/indexedDb.ts)) — full cached test files and per-test sessions/resume data (`saveTestSession`, `saveCachedTest`), no quota concerns so images are kept here.

### Telegram integration
[src/utils/telegramWebApp.ts](src/utils/telegramWebApp.ts) wraps the injected `window.Telegram.WebApp` SDK; [src/hooks/useTelegramWebApp.ts](src/hooks/useTelegramWebApp.ts) exposes it as a hook (`userInfo`, `colorScheme`, `haptic`, `showBackButton`, header/background color setters). `App.tsx` syncs MUI theme with Telegram's color scheme and wires the Telegram back button to page navigation.

### i18n & theming
- Two languages, **Uzbek (`uz`, default) and Russian (`ru`)** — [src/i18n/](src/i18n/) with `react-i18next`. Much of the existing UI copy and code comments are in Uzbek; match that when editing user-facing strings.
- Theme: a Gmail-inspired MUI theme in [src/theme/theme.ts](src/theme/theme.ts) (`createAppTheme`, `gmailColors`), light/dark, persisted and synced with Telegram.

## Deployment

Push to `main`/`master` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml) → GitHub Pages. The workflow sets `VITE_BASE_PATH` from the repo name so Vite's `base` resolves correctly (e.g. `/quiz/` for a project repo, `/` for a `user.github.io` repo) — never hardcode the base path; read it via `import.meta.env.BASE_URL`.
