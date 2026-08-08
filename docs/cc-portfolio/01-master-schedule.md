# Capital Context — active projects and schedule to November 1

Version 1, 2026-08-01. Supersedes the sequencing in `00-development-portfolio.md`.

**Fixed constraint:** client one launches outreach **Nov 1**. Thirteen weeks.
**Capacity:** John White, daily, seven days a week from Aug 2.

---

## Active projects

| # | Project | State | Next milestone | Blocking? |
|---|---|---|---|---|
| 1 | **IAM** — Universe Database | Scaffolded. 11 prompts ready. No code | v0.1 — Universe live with data, **Aug 15** | **Yes — critical path** |
| 2 | **Capital Raise Module** (`IAspecmodule/crm`) | ~80%. 30 commits. Phases 1–6 built | North Capital TransactAPI, **week of Aug 3** | **Yes — critical path** |
| 3 | **IAM ↔ CRM seam** | Both ends exist, unconnected | Export path into `investor_targets` | **Yes — critical path** |
| 4 | **D&D** — Investment Development | Spec being rewritten | Spec delivered **week of Aug 3**, then split into prompts | No — see note |
| 5 | **CC Investor Program** | Operational | None. Do not touch | No |
| 6 | **Capital Context Access** (`ias-v1`) | Member login and entitlements built. Module pages are placeholders | Resolve duplicate investor login vs. the CRM portal | **Yes — October build depends on it** |

---

## Version definitions

Naming what "done" means at each step, so a version is a decision rather than a feeling.

### IAM

| Version | Contains | Target |
|---|---|---|
| **v0.1** | Phase 1a + S. Schema, loaders, live records for HNW / FO / RIA with email + LinkedIn, deduplicated, batch provenance. No scoring | **Aug 15** |
| **v0.2** | Thin export path: selected Universe records land in a client's `investor_targets` via `POST /targets`. Suppression enforced. Provenance-gated | **Sep 15** |
| **v0.3** | Phase 1b + 1c. Evidence ledger, claim registry, feature registry, deterministic scoring framework, agent framework | Q4 |
| **v1.0** | Phase 2a–2d. RIA at qualified depth, hard gates, publication | Q1 2027 |
| **v1.1** | Phase 5 fit engine. Offering profiles, category fit, assignment, conflict management | Q1 2027 |
| **v1.2** | Phase 6. Outcome learning loop from CRM events | Q1–Q2 2027 |

### Capital Raise Module

| Version | Contains | Target |
|---|---|---|
| **v0.8** | Current. Campaigns, data room, onboarding, funding, portal, support dashboard, Smartlead / SuiteCRM / Mautic | Now |
| **v0.9** | North Capital TransactAPI: KYC/AML, 506(c) verification, subscription docs, escrow | **Aug** |
| **v1.0** | Remaining 20% — *contents unknown to me*. Plus client-one production readiness | **Oct 15** |

### D&D

| Version | Contains | Target |
|---|---|---|
| **v0.1** | Spec delivered and split into sequenced prompts | Aug |
| **v0.5** | Enough to produce one structured offering profile for client one | Sep |
| **v1.0** | Full spec | Q1 2027 |

---

## Schedule, working back from Nov 1

### Now — before Aug 2

- [x] ~~What is `ias-v1`?~~ Capital Context Access. Live, distinct role.
- [ ] **ADR rework** — ~2 hours, mine. The Universe needs its **own database**, not four
      schemas inside Capital Context Access's `ias` database. Rewrite ADR-002 against the
      real three-database picture (CC Access · CRM platform · CRM per-client), rewrite
      ADR-003 to name both bridges, cut Phase 1d's integration scope now the CRM holds
      most of it. **Must happen before day 1 of the IAM runbook, which currently creates
      the Universe schemas in the wrong database.**

### Aug 2–15 — IAM v0.1

Per `ias-iam/docs/runbook-phase-s.md`. Infra, Phase 1a, Phase S, four staged loads,
verification. Track B (Apollo tranches, FO list, RIA work located, SEC files) front-loaded
to days 1–4.

**In parallel, not by you:** CRM North Capital integration.

**Milestone: Universe live with real records.**

### Aug 16–31 — CRM v0.9 and D&D v0.1

- North Capital integration completed and tested
- **Persist North Capital webhook payloads even though IAM cannot consume them yet.**
  Verification and funding events are the outcome labels for IAM v1.2. Outcome history
  cannot be retrofitted
- D&D spec arrives → I split it into sequenced prompts
- Decide the remaining 20% of CRM and schedule it

### Sep 1–30 — IAM v0.2, the seam

- Export path: Universe → `investor_targets` via `POST /targets`, carrying
  `universe_person_id`, `investor_type`, `fit_score`
- Suppression enforced at the boundary; provenance gating (Apollo-sourced contacts
  respect their source terms)
- **Smaller than originally scoped.** Both ends already exist — the CRM's `InvestorTarget`
  was built with `universe_person_id` in it. This is days, not weeks
- D&D build begins

### Oct 1–15 — client one readiness

- CRM v1.0: remaining 20%, production deploy
- Offering profile for client one — from D&D if ready, hand-built if not
- **Target selection: by hand.** SQL against the Universe plus your judgment. The fit
  engine is deliberately not on this path
- Targets loaded into client one's database

### Oct 16–31 — rehearsal

- Campaign built in the CRM, sequences drafted, data room populated
- Email verification pass (NeverBounce) over the selected targets before any send
- End-to-end dry run: target → campaign → portal → onboarding → North Capital
- Client walkthrough and sign-off

### Nov 1 — outreach launches

---

## Critical path

```
IAM v0.1 (Aug 15) ──► IAM v0.2 seam (Sep) ──┐
                                             ├──► targets loaded (Oct 15) ──► Nov 1
CRM v0.9 (Aug) ──► CRM v1.0 (Oct 15) ───────┘
                                             │
offering profile (D&D or manual, Sep) ──────┘
```

Four things must land. Everything else is off the path and can slip into Q1 without
touching the date.

**Explicitly not on the path:** IAM evidence ledger, scoring framework, agent framework,
RIA qualification depth, the fit engine, the outcome learning loop. That is roughly 50–80
focused days deliberately deferred.

---

## The three biggest risks

**1. The remaining 20% of the CRM is unknown to me.** It is on the critical path and I
cannot size it. If that 20% is polish, October is comfortable. If it is multi-client
production hardening or the client-facing onboarding flow, October is tight. This is the
single largest unknown in the plan.

**2. IAM v0.1 has no slack.** Fourteen consecutive days against a 9–14 day estimate. The
likely slip is days 11–14, first contact with real data. A slip to Aug 17 is harmless;
a slip past Aug 22 starts eating September.

**3. Nobody has run the end-to-end path.** Target → campaign → reply → portal → onboarding
→ North Capital → funding has never been exercised whole. The Oct 16–31 rehearsal is where
that gets found out. Do not compress it — it is the difference between finding the broken
seam in rehearsal and finding it in front of the client.

---

## Resolved 2026-08-01

- **`ias-v1` is Capital Context Access** — the member front door, not a superseded Capital
  Raise Module. Distinct role, still live. The Phase 0 superuser work on it stands.
- **Capital Raise Module is at `IAspecmodule/crm`** — Python/FastAPI/Alembic,
  database-per-client, 30 commits.

## Still open

| Question | Blocks |
|---|---|
| ADR rework — Universe needs its own database, not schemas inside CC Access's | **IAM runbook day 1, tomorrow** |
| What is in the remaining 20% of the CRM? | Sizing October |
| Which system owns investor login — CC Access or the CRM portal? | October build; see register module 4 |
| Does client one's offering exist as a document today? | Whether D&D is on the critical path |
