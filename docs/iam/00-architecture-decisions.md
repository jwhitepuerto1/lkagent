# IAS IAM — Architecture Decision Record

Status: **accepted** 2026-08-01, in conversation with John White.
Recorded here so the decisions are not re-litigated mid-build. Any of the four can be
reopened — ADR-001 and ADR-002 cheaply before Phase 1a, ADR-003 cheaply before Phase 2c,
ADR-004 at any time.
Date: 2026-08-01
Context document: `IAS Investor Acquisition Module.docx` (Master Functional and Development Specification)

These four decisions must be settled before any Claude Code prompt is submitted. Each
one, left ambiguous, is something Claude Code will silently guess at — and each wrong
guess is expensive to unwind after the foundation is built.

---

## ADR-001 — IAM is a separate Python service, not an extension of `ias-v1`

### Context

The Master Specification (Part I §8, and every prompt in Parts II–VI) mandates Python
3.12, FastAPI, SQLAlchemy, Alembic, and Pydantic. The existing `ias-v1` repository is
Next.js 16 (Pages Router), Prisma 7, and JavaScript, with three commits of history and
no automated test suite.

Submitting the specification's prompts unmodified into `ias-v1` produces one of two bad
outcomes: Claude Code refuses because the request violates `AGENTS.md` ("implement under
`pages/` and related shared libs only", "do not introduce App Router patterns"), or it
improvises a second stack inside a JavaScript repository with no agreed boundary between
them.

### Decision

Build the IAM as a new, separate Python service in its own repository (working name
`ias-iam`), sited as a sibling of `ias-v1`. Do not rewrite the specification for
Node/Prisma.

`ias-v1` retains its current responsibilities and is not refactored as part of this work:

- Member identity and self-service registration (`MemberAccount`, `Entitlement`)
- The investor portal surface
- The `Lead` / `Activity` CRM projection and its UI
- Campaign, dashboard, and analytics pages

### Rationale

- The specification was designed stack-first for Python. Transliterating roughly seventy
  pages into Prisma schema, Zod contracts, and Next.js route handlers is multiple weeks of
  work that must complete *before* the first prompt can be submitted, and it buys only
  language uniformity.
- The workload that dominates the IAM — LLM-based evidence extraction, deterministic
  scoring services, model registries and versioning, agent orchestration — is far
  better served by the Python ecosystem than by Node.
- `ias-v1` is an early prototype. There is very little existing investment to preserve,
  so the usual argument for staying in-stack ("don't fragment a mature codebase") does
  not apply here.
- The existing identity kernel (`Party` / `ContactPoint` / `ExternalIdentity`) was
  already built on the assumption that many external systems feed one canonical party
  record. A second service is closer to the shape already started than a monolith is.

### Consequences

- Two codebases in two languages, with a network boundary and an authentication story
  between them. Accepted.
- The team needs a Python deployment path alongside the existing Node one.
- Integration risk concentrates at one seam, which is preferable to it being diffuse.
  That seam is specified in ADR-002 and ADR-003.

---

## ADR-002 — One Postgres cluster, separate schemas, no cross-schema access

### Context

The specification (Part II, "DATABASE SCHEMAS") requires four schemas: `ias_core`,
`ias_score`, `ias_ops`, `ias_gateway`. `ias-v1` already owns tables in `public` and
migrates them with Prisma. Two migration tools pointed at one database is a well-known
way to corrupt state.

A stronger constraint comes from the specification itself. Part I §3.10 and Part II
("CLIENT EXPORT RULES") exist specifically so the proprietary Universe cannot be read
directly by clients or by client-facing systems. If the portal application can issue a
`SELECT` against `ias_core`, that control is defeated regardless of what the export
gateway code does.

### Decision

1. Both services share one Postgres cluster.
2. `ias-iam` owns and migrates `ias_core`, `ias_score`, `ias_ops`, `ias_gateway` — with
   Alembic, exclusively.
3. `ias-v1` owns and migrates `public` — with Prisma, exclusively.
4. Neither service's migration tool is ever pointed at the other's schemas.
5. **No cross-schema foreign keys and no cross-schema joins, ever.** Association between
   the two sides is by UUID, resolved at the application layer through the export
   gateway API.
6. This is enforced at the database, not by convention: the Postgres role used by
   `ias-v1` is granted no privileges on any `ias_*` schema. The role used by `ias-iam`
   is granted no privileges on `public`.

The shared cluster is an operational convenience — one backup, one connection story,
one thing to monitor. It is explicitly **not** an integration point.

### Consequences

- Splitting the two into separate clusters later is a configuration change, not a
  rewrite, because no join or foreign key will have accreted across the boundary.
- Cross-domain reporting that spans both sides must go through the API, or through a
  separate read model. It cannot be done with an ad-hoc join. This is intended.
- Grant configuration becomes part of the deployment runbook and must be verified in
  CI or at startup, not assumed.

---

## ADR-003 — `ExternalIdentity` is the bridge; IAM owns Universe identity

### Context

Both systems have a concept of a person. `ias-v1` has `Party`. The IAM specification
(Part II, "CORE ENTITIES") defines `person`, `organization`, `person_identifier`, and
`capital_source`. Without an explicit rule, two competing identity systems will diverge,
and reconciling them after both hold production data is painful.

`ias-v1` already has an `ExternalIdentity` model built for exactly this purpose, with
`@@unique([system, externalId])` and `@@unique([system, partyId, objectType])`
constraints that prevent identity fragmentation across tools.

### Decision

- **IAM is canonical for capital sources.** `person`, `organization`, and
  `capital_source` in `ias_core` are the system of record for the Universe.
- **`ias-v1` is canonical for portal members and leads.** `Party`, `MemberAccount`,
  `Entitlement`, and `Lead` remain the system of record for people who have a
  relationship with the client-facing application.
- The link between them reuses the existing `ExternalIdentity` model rather than
  introducing a second mapping table. This requires adding `IAM` to the `ExternalSystem`
  enum and `CAPITAL_SOURCE` to the `ExternalObjectType` enum.
- The same natural person may legitimately exist on both sides (a Universe capital
  source who later registers for the portal). That is expected, and the
  `ExternalIdentity` row is what ties them together.

**Settled 2026-08-01:** for the RIA category the *firm* is the capital source;
advisers are decision-makers and access paths attached to it, carrying their own
offering-fit assessments but not independent `capital_source` records. Recorded as
assumption A-003. Reopen before Phase 2c if wrong.

The schema change is **deferred until Phase 6**, when behavioural and outcome events
first flow back from campaigns. It is prepared as a ready-to-apply diff in
`20-prisma-bridge.md` rather than applied now, because applying it early would leave the
Prisma schema ahead of the deployed database for months with no consumer.

### Consequences

- No new identity concept is introduced on the `ias-v1` side; the existing uniqueness
  constraints do the work.
- Identity resolution logic lives in exactly one place per domain, and neither side
  needs to replicate the other's matching rules.

---

## ADR-004 — Submit phased prompts, not the specification's prompts as written

### Context

Part II of the specification is a single prompt requesting 20 shared components, 34
database entities, 15 workflow event types, and 20 distinct deliverables. Parts III–VI
are comparably large.

Output at that scale cannot be meaningfully reviewed. Unreviewed foundation code is the
most expensive category of technical debt, because every later phase is built on top of
whatever assumptions went unexamined.

### Decision

Part II is split into four sequenced prompts (`10`–`13` in this directory), each
independently reviewable and testable:

| Prompt | Scope | Shared components covered |
|---|---|---|
| 1a | Persistence foundation | 18, 19, 20 (+ all 34 entities) |
| 1b | Intake and evidence | 1, 2, 3, 4, 5 |
| 1c | Scoring and agents | 6, 7, 8, 9, 17 |
| 1d | Governance and gateway | 10, 11, 12, 13, 14, 15, 16 |

Each prompt is submitted only after the previous one has been reviewed, its tests pass,
and its output has been committed.

Phases 2–6 follow the specification's own Part VIII sequence: RIA, then Family Office,
then HNW, then the Fit Engine, then behavioural and outcome learning. RIA leads because
its source data is public, structured, already being assembled, and gives the cleanest
first test of whether the evidence-ledger-plus-deterministic-scoring pattern holds up
before it is pointed at fuzzier HNW data.

Note: the recommendation originally discussed a three-way split. It is four here because
the third grouping still contained eleven of the twenty shared components, which
reintroduces the reviewability problem the split exists to solve.

### Consequences

- Slower to start, materially faster to correct.
- Each phase produces a commit that can be reasoned about in isolation.
- If a foundational assumption proves wrong, it is discovered against one prompt's
  output rather than against the whole foundation.
