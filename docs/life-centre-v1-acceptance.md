# Life Centre V1 — Acceptance Criteria

## Product outcome
The Life Centre is a local-first personal operating system. Core tracking/planning must work without Claude. AI is an optional reasoning partner.

## Core requirements
- Every major tab renders without crashing.
- Core CRUD/tracking works without an AI API key.
- Existing user data is preserved during migration.
- A corrupt local-storage record cannot prevent app startup.
- Today is calculated from the user's local date, not hardcoded.
- Overdue/today/upcoming task states are derived from actual dates.
- Goals, tasks and paths can be added/updated/paused/completed/archived without deleting history.
- Journal and Health remain privacy-protected and are not automatically sent to AI.
- AI failure leaves the local feature usable and shows a clear error state.
- No API secret is included in frontend code or bundles.
- PWA install/update behavior remains functional.
- Production build succeeds with `npm run build`.

## Command Centre V1
The home command centre should surface:
- urgent/overdue work
- today's priorities
- upcoming deadlines
- active goals
- current path
- progress by domain
- important warnings
- optional AI recommendations

## AI acceptance
- Frontend calls the server-side `/api/claude` route rather than Anthropic directly.
- AI model configuration is server-side/configurable.
- Only selected context is sent for a request.
- Health/Journal context requires explicit user selection.
- AI recommendations never mutate life data without user confirmation.

## Regression rule
Any PR that breaks an existing major module, persistence key, PWA install/update behavior, or local-first operation is not acceptable for V1.
