# CLAUDE.md — IAS Investor Acquisition Module (`ias-iam`)

> **Placement note.** This file is written here for review. When the `ias-iam`
> repository is created, move it to that repository's root and rename it `CLAUDE.md`.
> It is deliberately *not* named `CLAUDE.md` inside `ias-v1`, so that Claude Code
> sessions working on the portal do not pick up rules meant for a different service.

---

## What this service is

`ias-iam` is the capital-source intelligence service for Capital Context. It builds,
maintains, qualifies, and applies the proprietary Capital Context Universe Database.

It is governed by the Master Functional and Development Specification
(`IAS Investor Acquisition Module.docx`). Where this file and the specification appear to
conflict, stop and raise the conflict rather than choosing one.

It is **not** the client-facing application. That is `ias-v1`, a separate Next.js
repository. See "Boundary rules" below.

---

## Stack

- Python 3.12
- FastAPI
- PostgreSQL 16
- SQLAlchemy + Alembic
- Pydantic
- Redis, only where a cache or lock is genuinely needed
- PostgreSQL-backed job queue for workflow orchestration (Temporal is a possible later
  layer; do not introduce it now)

Do not add frameworks, ORMs, queue systems, or vector stores beyond this list without
asking first.

---

## Boundary rules — these are hard constraints

1. **This service owns the schemas `ias_core`, `ias_score`, `ias_ops`, `ias_gateway`
   and nothing else.** It never reads from or writes to the `public` schema.
2. **Never create a foreign key or a join that crosses into `public`.** The `ias-v1`
   application's data is reachable only through its HTTP API, and in practice should
   not be reached at all — data flows outward through the export gateway, not inward
   by query.
3. **Alembic migrates only the four `ias_*` schemas.** Never generate a migration that
   touches `public`. Prisma, in the other repository, owns that schema exclusively.
4. **The Universe is never exposed directly.** All data leaving this service for a
   client or for a client-facing system goes through the Client Export Gateway and is
   filtered by its rules. There is no second path out.
5. If a task appears to require crossing any of these boundaries, stop and say so
   before writing code.

---

## Non-negotiable domain invariants

These come from the specification and are the reason the system exists. Violating any of
them is a correctness bug, not a style preference.

1. **LLM agents may extract and classify evidence. They must never calculate a final
   production score.** All production scores are computed by deterministic,
   version-controlled Python services.
2. **Every material conclusion must be traceable to an evidence item**, and every
   evidence item to an approved source. No fact enters a score without lineage.
3. **No source may be ingested until it is approved in the source registry**, with its
   permitted uses, prohibited uses, and licensing restrictions recorded.
4. **Modelled accreditation probability is never represented as legal verification.**
   These are separate fields with separate vocabularies, and the distinction must
   survive every transformation and export.
5. **Unknown data reduces coverage. It is never treated as a positive match.**
6. **Hard restrictions override fit scores.** A high score never overrides a
   restriction.
7. **Historical score snapshots are immutable.** Recalculation writes a new snapshot; it
   never mutates an old one.
8. **Suppression always wins.** No agent, override, or export path may bypass an active
   suppression.
9. **One client can never see another client's campaign activity, offering history, or
   behavioural events.** This is a tested property, not an assumption.
10. Use the term **"due diligence"** for the investor review process, consistently, in
    code, data, and documentation.

---

## Implementation style

- Clean architecture with dependency injection. Keep the layers honest: API depends on
  services, services depend on repositories, repositories own SQLAlchemy. Domain logic
  does not import FastAPI.
- Type hints throughout. Pydantic contracts at every boundary.
- Structured JSON logging.
- Environment-based configuration. **Secrets never appear in source code**, in test
  fixtures, or in seed data.
- Unit tests and integration tests for every component. A phase is not complete when the
  code exists; it is complete when its tests pass.
- Prefer small, composable services over broad ones. Every deterministic scoring service
  should be independently testable with no database and no network.

---

## Working agreement

- Keep diffs minimal and targeted to the requested task. Do not opportunistically
  refactor adjacent code.
- Do not add diagnostic, debug, or scratch code to runtime modules.
- When a requested change conflicts with any rule above, stop and call out the conflict
  before editing.
- When an assumption has to be made because the specification is silent, record it in
  `docs/assumptions.md` rather than burying it in an implementation. Maintaining that
  list is a standing deliverable, not a one-off.
- Do not build category-specific qualification logic (HNW, Family Office, RIA) into the
  shared foundation. Define clean interfaces; the submodules implement them in later
  phases.
