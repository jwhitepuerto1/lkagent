# Phase 0 — Prerequisites before the first prompt

Phase 0 is human work, not Claude Code work. It is roughly half a day plus one item with
a longer lead time that should start immediately.

---

## 1. Create the `ias-iam` repository

- [ ] New repository, sibling to `ias-v1`
- [ ] Move `01-CLAUDE.iam-service.md` to its root and rename it `CLAUDE.md`
- [ ] Copy `00-architecture-decisions.md` to `docs/`
- [ ] Copy `50-spec-master.md` to `docs/` — the Markdown conversion of the Master
      Specification, so Claude Code can consult it directly rather than working from
      prompt text alone. Structural conversion only; the `.docx` remains authoritative
- [ ] Create an empty `docs/assumptions.md` — every phase appends to it

## 2. Sign off the architecture decisions

Read `00-architecture-decisions.md` and confirm or amend each of the four ADRs. These
are the decisions Claude Code will otherwise guess at:

- [ ] ADR-001 — separate Python service
- [ ] ADR-002 — one cluster, separate schemas, no cross-schema access
- [ ] ADR-003 — `ExternalIdentity` bridge, IAM canonical for Universe identity
- [ ] ADR-004 — four phased prompts, RIA first after the foundation

## 3. Start the source licensing review now — this has the longest lead time

Part I §3.1 of the specification is unambiguous: *no source may enter production
ingestion until approved.* Phase 2 (RIA) cannot ingest anything until the registry is
seeded with real, reviewed terms. If this review has not started by the time Phase 1d
lands, the build stalls regardless of how good the code is.

Use `51-source-registry-review.xlsx` in this directory. It lists all twelve sources with a
column per required field, a worked example row, per-field guidance on which questions
belong to counsel, and a completion count. Phase 2a is blocked until every RIA source is
Approved or explicitly dropped.

For each intended source, record:

- [ ] Source name and type
- [ ] Permitted fields
- [ ] Permitted uses
- [ ] Prohibited uses
- [ ] Licensing restrictions
- [ ] Retention requirements
- [ ] Refresh schedule
- [ ] Reliability rating
- [ ] Terms-review date

Sources named in the specification, to review: SEC/IAPD, Form ADV Parts 1 and 2A, Form
ADV Schedule D, Form CRS, state adviser sources, IAPD individual records, FINRA
BrokerCheck, RIA websites and team biographies, approved commercial contact sources, and
whatever "GlobalDB" resolves to in the existing `ExternalSystem` enum.

The public regulatory sources are the least encumbered, which is a further argument for
RIA being the first submodule. Commercial contact data is where the restrictions
usually bite — particularly around retention and onward disclosure to clients, which is
exactly what the export gateway does.

I am not a lawyer, and the permitted-use classification on each source is a question for
yours. What the system can do is enforce whatever classification you give it; it cannot
determine what that classification should be.

## 4. Note the single-tenant auth conflict

`lib/auth.js` in `ias-v1` issues a hardcoded session:

```js
const payload = { sub: "single-tenant", role: "admin", iat: now, exp: now + TTL_SECONDS };
```

The specification requires RBAC and hard isolation between clients — *"two clients cannot
view one another's campaign behaviour"* is an explicit test case in Part VI, and the
export gateway rules in Part II depend on it.

This is fine while there is one client. It must be replaced before multiple sponsors'
campaigns coexist in `ias-v1`.

- [ ] Logged as known work, scheduled before Phase 5 (Fit Engine)
- [ ] Note that `AGENTS.md` currently forbids changing `lib/auth.js` without explicit
      instruction — that guardrail will need to be lifted deliberately when the time comes

Nothing in Phases 1a–1d is blocked by this. It is recorded here so it does not surface
as a surprise at the point where client isolation stops being hypothetical.

## 5. Decide the deployment target for the Python service

- [ ] Where `ias-iam` runs
- [ ] How it reaches the Postgres cluster
- [ ] Which Postgres roles exist, and confirmation that the `ias-v1` role has no grants
      on `ias_*` (ADR-002 requires this to be enforced, and Phase 1a tests it)
- [ ] Which LLM provider is approved, and how its credentials are supplied by environment

---

## Submission order

Submit one prompt at a time. Review, test, and commit before the next.

| Order | Prompt | File |
|---|---|---|
| 1 | Phase 1a — Persistence Foundation | `10-phase1a-persistence.md` |
| 2 | Phase 1b — Intake and Evidence | `11-phase1b-intake-evidence.md` |
| 3 | Phase 1c — Scoring and Agents | `12-phase1c-scoring-agents.md` |
| 4 | Phase 1d — Governance and Gateway | `13-phase1d-governance-gateway.md` |
| 5 | Phase 2 — RIA submodule | Spec Part V, to be split similarly |
| 6 | Phase 3 — Family Office submodule | Spec Part IV |
| 7 | Phase 4 — HNW submodule | Spec Part III |
| 8 | Phase 5 — Client and Offering Fit Engine | Spec Part VI |
| 9 | Phase 6 — Behavioural and outcome learning | Spec Part VIII §6 + `20-prisma-bridge.md` |

Each of Parts III–VI is comparable in size to Part II and will need the same treatment
before submission. Do that splitting when the phase is next, not now — the shape of the
split should be informed by what the foundation actually turned out to look like.

Each prompt ends by asking Claude Code to summarise its intended approach and wait for
confirmation before writing code. Use that checkpoint. It is the cheapest place in the
whole process to catch a wrong assumption.
