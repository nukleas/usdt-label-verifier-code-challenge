# Repository Guidelines

## Project Structure & Module Organization
Routes live in `app/`; the agent workflow sits in `app/verify`, with OCR handlers in `app/api/verify` and `app/api/verify-server`. Shared UI is in `components/verification`, domain helpers in `lib/`, and types in `types/`. Assets live in `public/` and `app/img`. Tests mirror source under `__tests__/`, Playwright specs in `tests/e2e`, and automation scripts in `scripts/`.

## Core Product Expectations
Re-read `project-requirements.md` before scoping work. Preserve the simplified TTB workflow: keep required form fields, route images through OCR, and surface clear pass/fail messaging. Handle unreadable labels gracefully and log any trade-offs or shortcuts in the PR.

## Build, Test, and Development Commands
- `pnpm dev` starts the local Next.js server at `http://localhost:3000`.
- `pnpm build` runs `scripts/copy-tesseract-assets.js` then compiles the production bundle.
- `pnpm start` serves the built app; run after `pnpm build`.
- `pnpm lint` applies the Next/TypeScript ESLint rules; use `pnpm lint:fix` for autofixes.
- `pnpm test` executes the Jest suite; append `:watch` or `:coverage` as needed.
- `pnpm test:e2e` runs Playwright specs (`:headed` and `:debug` offer interactive modes).

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation, trailing commas, and the Next.js Core Web Vitals rules enforced via ESLint. Name React components and files with PascalCase (`LabelForm.tsx`), hooks with `use*`, and utilities with camelCase. Co-locate styles with their components when practical, keep shared test helpers in `__tests__/utils`, and reserve default exports for pages and layouts.

## Testing Guidelines
Jest and Testing Library cover unit and integration cases; add new `.test.ts(x)` files in the mirrored path under `__tests__/`, and reuse the existing OCR mocks. Aim to validate success, mismatch, and error states, and check coverage with `pnpm test:coverage` before merging. Playwright `.spec.ts` files in `tests/e2e` should exercise the end-to-end agent path; run them in headed mode for UI changes and attach failure artifacts to the PR.

## Commit & Pull Request Guidelines
Keep commits small, present-tense summaries (e.g., `add playwright tests`) and group related work only. Reference issue IDs or requirement sections in the body when relevant. PRs should explain the change, list testing commands, attach UI screenshots when applicable, and flag OCR asset or env updates for deployment review.

## Tesseract Assets & Configuration
OCR depends on `eng.traineddata`. Run `pnpm copy-tesseract` (or any build) to stage assets into `.next/`. When adding languages or moving files, update `scripts/copy-tesseract-assets.js`, verify `public/ocr/`, and note secret requirements in `.env.local`.
