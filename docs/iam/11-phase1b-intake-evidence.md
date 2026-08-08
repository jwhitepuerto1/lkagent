# Phase 1b — Intake and Evidence

**Prerequisite:** Phase 1a reviewed, tests passing, committed.
**Covers shared components:** 1 (Source Governance), 2 (Raw Data Ingestion),
3 (Identity Resolution), 4 (Evidence Ledger), 5 (Evidence Claim Registry).
**Goal of this phase:** raw source record → resolved identity → stored evidence, with
lineage intact end to end. Still no scoring, no agents.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phase 1a delivered the persistence foundation: schemas, models, contracts, repositories,
audit logging, and RBAC primitives. This is Phase 1b. Read CLAUDE.md and the Phase 1a
architecture document before starting.

Scope: the path from an approved external source to a stored, lineage-complete evidence
item. Nothing downstream of that.

SCOPE OF THIS PHASE

1. Source Governance Service (shared component 1)
   Maintain the registry of approved sources. Each source record holds:
     source name, source type, permitted fields, permitted uses, prohibited uses,
     licensing restrictions, retention requirements, refresh schedule, reliability
     rating, terms-review date.

   Hard rule: no source may enter production ingestion until it is approved. Ingestion
   must be structurally incapable of running against an unapproved or expired source —
   enforce it in the service, not by convention, and test it.

   Permitted-use classification set on a source must propagate to every evidence item
   derived from it, and must survive into the export decision later.

2. Raw Data Ingestion Service (shared component 2)
   - Import structured and unstructured source records.
   - Preserve raw source references verbatim.
   - Generate content hashes.
   - Identify changed records against prior batches.
   - Prevent duplicate ingestion.
   - Record collection dates distinctly from observation dates.
   - Emit events only for material changes, so that downstream workflows are not woken
     by no-op refreshes. Define "material" explicitly and make it configurable per source.

   Ingestion writes raw_record and ingestion_batch. It does not interpret content.

3. Person and Organization Identity Resolution (shared component 3)
   Resolve: natural persons, RIA firms, family offices, related entities, employers,
   investment companies, trusts, funds, real estate entities, sponsor organizations.

   Hard rule: records must NOT be merged solely because names are similar. Require
   corroborating identifiers. Every merge decision must be recorded, reversible, and
   attributable. Produce an identity confidence score — the category gates in later
   phases depend on it (HNW requires >= 0.95, family office >= 0.90, RIA >= 0.95).

   Provide a deterministic, testable matching pipeline. If a probabilistic component is
   used, its output is a candidate for review, never an automatic merge above the
   confidence thresholds above.

4. Evidence Ledger (shared component 4)
   Every material fact used for qualification or scoring is stored as evidence, with:
     source, subject, claim, observed value, collection date, observation date,
     reliability, directness, extraction confidence, expiration date, supporting source
     reference, contradictions, permitted-use classification.

   Requirements:
   - Evidence is append-only. Corrections supersede; they never overwrite.
   - Expiry is a first-class concept: an expired evidence item must stop contributing to
     any assessment automatically, and must be able to expire an assessment that depended
     on it.
   - Contradiction is a first-class concept: two evidence items may disagree, and the
     ledger must represent that without resolving it. Resolution is a later concern.
   - The evidence item contract from the specification is canonical. Do not alter it.

5. Evidence Claim Registry (shared component 5)
   A versioned, controlled vocabulary of claim codes (for example
   PRIVATE_REAL_ESTATE_INVESTMENT). Claim codes are not free text. Each claim code
   defines its expected value shape, its polarity semantics, and its default validity
   period. Later phases add category-specific codes; this phase provides the registry
   and the shared codes only.

6. API endpoints for the above, respecting the Phase 1a RBAC matrix.

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement: feature calculation, any scoring, agents or LLM calls, workflow
orchestration, the review queue, suppression enforcement, the export gateway, or any
category-specific logic. Evidence is stored in this phase; nothing yet consumes it.

TESTS

Provide unit and integration tests confirming that:
- an unapproved source cannot be ingested
- a source past its terms-review date cannot be ingested
- re-ingesting identical content produces no new raw_record and no change event
- a material change produces exactly one change event; an immaterial one produces none
- two people with the same common name and no corroborating identifier are NOT merged
- a merge decision is recorded, attributable, and reversible
- identity confidence is computed and persisted
- evidence cannot be updated in place; a correction creates a superseding item
- an expired evidence item stops contributing
- contradictory evidence is representable without either item being discarded
- permitted-use classification propagates from source to evidence item
- an unknown claim code is rejected

DELIVERABLES

migrations (if any beyond 1a), services, repositories, contracts, API endpoints,
unit tests, integration tests, documentation, and an updated docs/assumptions.md.

Before writing code, summarise your identity-resolution matching strategy and your
definition of a "material change" per source type, and wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] Unapproved-source ingestion is blocked by construction, and a test proves it
- [ ] Content hashing and change detection actually prevent duplicate work
- [ ] "Material change" is defined per source type, not globally hand-waved
- [ ] Name-only merges are impossible, and the test for it is real
- [ ] Merge decisions are reversible — verify by reversing one
- [ ] Evidence is genuinely append-only
- [ ] Expiry propagates: confirm an expiring item can invalidate a dependent assessment
- [ ] Permitted-use classification survives from source through to evidence
- [ ] No LLM call exists anywhere in this phase
