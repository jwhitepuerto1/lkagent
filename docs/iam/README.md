# IAS IAM — Claude Code implementation pack

Working documents for implementing the IAS Investor Acquisition Module, derived from the
Master Functional and Development Specification (`IAS Investor Acquisition Module.docx`).

These files live in `ias-v1/docs/iam/` for review. Most of them move to the new
`ias-iam` repository once it exists — see `30-phase0-checklist.md`.

## Contents

| File | Purpose | Destination |
|---|---|---|
| `00-architecture-decisions.md` | Four ADRs settling service boundary, schema ownership, identity ownership, and prompt phasing | `ias-iam/docs/` |
| `01-CLAUDE.iam-service.md` | Guardrails for Claude Code working in the new service | `ias-iam/CLAUDE.md` (rename) |
| `10-phase1a-persistence.md` | Prompt 1 of 4: schemas, 34 entities, contracts, repositories, audit, RBAC | submit to Claude Code |
| `11-phase1b-intake-evidence.md` | Prompt 2 of 4: source governance, ingestion, identity resolution, evidence ledger | submit to Claude Code |
| `12-phase1c-scoring-agents.md` | Prompt 3 of 4: feature registry, deterministic scoring, agent framework, model registry | submit to Claude Code |
| `13-phase1d-governance-gateway.md` | Prompt 4 of 4: orchestration, review, audit, suppression, behaviour, export, assignment | submit to Claude Code |
| `20-prisma-bridge.md` | Prepared but unapplied `schema.prisma` diff for Phase 6 | stays in `ias-v1` |
| `30-phase0-checklist.md` | Human prerequisites and full submission order | start here |
| `40-phase2-ria-overview.md` | Phase 2 split rationale, coverage map, three questions to settle first | `ias-iam/docs/` |
| `41-phase2a-regulatory-ingestion.md` | RIA prompt 1 of 4: ADV ingestion, firm entity resolution, status, data quality | submit to Claude Code |
| `42-phase2b-allocator-qualification.md` | RIA prompt 2 of 4: client base, private alternatives, private RE, accessibility, conflict | submit to Claude Code |
| `43-phase2c-people-authority.md` | RIA prompt 3 of 4: employees, roles, authority, decision paths, reachability | submit to Claude Code |
| `44-phase2d-scoring-publication.md` | RIA prompt 4 of 4: audit, qualification score, hard gates, publication | submit to Claude Code |
| `50-spec-master.md` | Markdown conversion of the Master Specification, for Claude Code to read directly | `ias-iam/docs/` |
| `51-source-registry-review.xlsx` | Source review — 10 of 12 pre-filled and approved; BrokerCheck and Apollo outstanding | working document |
| `60-apollo-export-conflict.md` | Open question: commercial contact data vs. the export gateway. Decide before Phase 2c | working document |

## Start here

Read `30-phase0-checklist.md`, then `00-architecture-decisions.md`.

Nothing should be submitted to Claude Code until the four ADRs are signed off, because
each unresolved decision is one Claude Code will make silently and expensively.

## What changed from the specification as written

The specification's Part II is a single prompt requesting 20 shared components, 34
entities, 15 workflow event types, and 20 deliverables. It is split here into four
sequenced prompts. Every component, entity, and deliverable from the original is
preserved; see the coverage table in `00-architecture-decisions.md` (ADR-004).

Part V (RIA) is split the same way — 16 agents, 10 tables, 23 reason codes, 10 hard
gates and 10 tests across four prompts. Coverage map in `40-phase2-ria-overview.md`.

Parts III, IV, and VI are not split yet, deliberately. Their shape should be informed by
what the foundation and the first submodule actually turn out to look like, not by what
was planned before either existed.

The specification's prompts also assume they are the only thing being built. The versions
here state explicitly that `ias-iam` is a new service alongside `ias-v1`, that it owns
four schemas and not the fifth, and that data leaves it only through the export gateway.

Each prompt now also ends by asking Claude Code to summarise its approach and wait for
confirmation before writing code, and each has a review checklist for accepting the
phase.
