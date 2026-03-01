# AGENTS.md

## Scope
- This repository uses **Next.js Pages Router**. Implement and modify features under `pages/` and related shared libs only.
- Do not introduce App Router patterns (`app/`, route handlers, server actions, RSC-only patterns) unless explicitly requested.

## Guardrails
- **Do not change authentication logic** in `lib/auth.js` unless explicitly asked.
- **Do not change Prisma or TLS configuration** in `lib/prisma.js` (including SSL/TLS behavior and connection setup) unless explicitly asked.
- **Do not add diagnostic or test code inside runtime files** (`pages/**`, `lib/**`, API handlers, or UI components). Keep runtime code production-focused.
- Keep diffs minimal and targeted to the requested task.
- When proposing or delivering edits, provide **full drop-in file contents** for each changed file.

## Implementation Style
- Favor small, composable helpers over broad refactors.
- Preserve existing behavior and coding style unless the task requires behavior changes.
- If a requested change conflicts with these guardrails, stop and call out the conflict before editing.
