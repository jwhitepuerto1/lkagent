# Capital Context — development portfolio register

Created 2026-08-01. Working document.

> **Placement note.** Written into `ias-v1/docs/` because that is the only writable
> location available. This document sits *above* any single module and should move to its
> own home — a `cc-portfolio` repo, a Notion page, wherever your planning lives. It
> should not stay inside a module it describes.

---

## The problem this solves

Six-ish modules in flight, artifacts spread across repositories, documents, and chat
histories. The instinct is to ask for a schedule. But a schedule is an *output* of
knowing what exists, what it depends on, and what state it is in — and right now that
inventory does not exist in one place.

Filling this register in is roughly half a day. After that the sequencing is close to
mechanical, because dependencies do most of the ordering for you.

---

## Register

One row per module. Only IAM is fully populated — it is the worked example for the
others.

### 1. IAS — IAM (Investor Acquisition Module)

| Field | Value |
|---|---|
| **Purpose** | Build, maintain, qualify and apply the proprietary CC Universe Database of capital sources |
| **Spec** | `IAS Investor Acquisition Module.docx` — complete, converted to `ias-iam/docs/spec-master.md` |
| **Code lives** | `ias-iam` (new, scaffolded, 5 commits, no application code yet) |
| **Stack** | Python 3.12 / FastAPI / PostgreSQL 16 / SQLAlchemy / Alembic |
| **State** | Phase 0 complete. Phase 1a not started |
| **Plan** | 11 sequenced prompts in `ias-iam/docs/prompts/` |
| **Next milestone** | Phase 1a + S — live Universe with real data, **target Aug 15** |
| **Depends on** | Nothing. It is upstream of everything else |
| **Feeds** | Capital Raising Module (qualified prospects, via export gateway) |
| **Open decisions** | A-003 adviser modelling (before Phase 2c), Sales Navigator approval. ~~Email verification~~ — resolved: NeverBounce, already in use in the CC Investor Program |
| **Owner** | John White |

### 2. IAS — Investment Development and Deployment (D&D)

| Field | Value |
|---|---|
| **Purpose** | Sourcing, underwriting, structuring, deployment — scope to be confirmed by the new spec |
| **Spec** | A first version exists. **John is writing an updated version for Claude to work on — expected week of Aug 3** |
| **Code lives** | Nothing current. Rebuild from the new spec |
| **State** | Spec in progress |
| **Next milestone** | Spec delivered, then split into sequenced prompts (same treatment as the IAM spec) |
| **Depends on** | Nothing upstream |
| **Feeds** | IAM fit engine — the structured **offering profile** originates here. Also feeds the Capital Raising Module |
| **Owner** | John White |

**When the spec lands:** same process as IAM. I read it, split it into reviewable phase
prompts, write the guardrails file, flag the decisions Claude Code would otherwise guess
at. That took about a day for the IAM spec and should be faster now the pattern exists.

### 3. IAS — Client and Support Facing Capital Raising Module

| Field | Value |
|---|---|
| **Purpose** | Client-facing capital raising: interface, campaign execution, support |
| **State** | **~80% complete. Real UI, real code, runs on localhost.** The most advanced module in the portfolio |
| **Code lives** | `C:\Users\jwhit\IAspecmodule\crm` |
| **Stack** | Python 3.12 / FastAPI / SQLAlchemy 2.0 async / Alembic / asyncpg · Next.js 16 App Router + Tailwind UI · **database-per-client** multi-tenancy via `app/db/provisioner.py` |
| **Next milestone** | Identify the remaining 20% |
| **Depends on** | IAM (qualified prospects, via export gateway) |
| **Feeds** | IAM (behavioural and outcome events) |
| **Open decisions** | Contents of the remaining 20%. Duplicate member login (see module 4) |
| **Owner** | John White |
| **Claude Code context** | Conversation "IAS module for Capital Raise" — **I cannot read this.** Claude Code transcripts sit under `C:\Users\jwhit\.claude`, a protected location that cannot be mounted. Mount the code folder instead |
| **In flight next week** | **North Capital TransactAPI** integration for investor onboarding |

#### North Capital — why this matters more than it looks

North Capital Private Securities' TransactAPI covers KYC/AML screening, compliance-grade
accredited-investor verification for 506(c), subscription document delivery and e-sign,
and payment/escrow.

Cross-referenced against the IAM specification, that single vendor covers **three of the
eight Phase 6 integrations** listed in Part VIII — verification provider, subscription
workflow, and funded-investment records — leaving only Smartlead, LinkedIn, Mautic,
SuiteCRM and the investor portal.

It also supplies **five of the fourteen behavioural events** in Part I §3.9, and they are
the five that matter most because they sit at the bottom of the funnel:

- accreditation verification started
- accreditation verification completed
- subscription started
- subscription completed
- capital funded

Those are the outcome labels the Phase 6 learning loop trains on. Everything above them
in the funnel — opens, replies, meetings — is leading indicator; these are the result.

**The cleanest part of the fit:** the IAM is forbidden from representing modelled
accreditation probability as legal verification. North Capital *is* the legal
verification. So the two never compete — IAM models probability, North Capital
establishes fact, and the `verification_attestation` table (already one of the 34 in
Phase 1a) is where the fact lands and overrides the model. That boundary is already in
the schema; it just needs wiring in Phase 6.

**Worth doing now, while the integration is being built:** whatever event or webhook shape
North Capital emits on verification and funding, capture it in a form the IAM can consume
later. Not building the IAM integration — just not throwing away the payloads. Retrofitting
outcome history is the one thing you cannot do after the fact.

### 4. Capital Context Access — `ias-v1`

| Field | Value |
|---|---|
| **Purpose** | Member front door. Self-service registration and login, with per-module access grants |
| **Code lives** | `C:\Users\jwhit\ias-v1` — Next.js 16 (Pages Router), Prisma 7, PostgreSQL on Elestio |
| **State** | Member identity system built and working: `MemberAccount`, `Entitlement`, `/members/register`, `/members/login`, `/members/account`. Dashboard, Campaigns and Analytics pages are placeholders |
| **Identified by** | `EntitlementModule` enum — `RESOURCES`, `CAPITAL_RAISE`, `DATA_ROOM`, `INVESTMENT_ACCOUNT` — and the comment in `pages/members/account.js`: *"Reference pattern for gating future member-facing pages (data room, capital raise, investment accounts)"* |
| **Owner** | John White |
| **Open decisions** | Single-tenant admin auth in `lib/auth.js`. Duplicate member login — see below |

**Correction, 2026-08-01.** An earlier draft of this register guessed `ias-v1` was an
early, superseded attempt at the Capital Raise Module. It is not. It is a distinct module
with a current role, and the Phase 0 work of moving it off the `postgres` superuser
remains valid and worth doing.

#### The duplicate member login — decide before client one

There are now **two self-service investor registration systems**:

| | Capital Context Access (`ias-v1`) | Capital Raise Module (`crm`) |
|---|---|---|
| Table | `MemberAccount` → `Party` | `platform_users`, role `client_readonly` |
| Access control | `Entitlement` per module, incl. `DATA_ROOM` | `investor_target_id` → the client's `investor_targets` |
| Signup | `/members/register` | self-service investor signup (commit `1768738`) |
| Gates | data room, capital raise, investment account | investor portal, data room |

Both register investors. Both gate a data room. Left as-is, an investor who signs up
through Capital Context Access and one who signs up through the CRM's investor portal are
two accounts, two passwords, two identities — for the same person.

The `EntitlementModule` enum suggests CC Access was *designed* to be the front door for
exactly what the CRM now implements independently. Three options:

1. **CC Access is the front door; the CRM portal trusts it.** Single sign-on, one member
   identity, `Entitlement` grants access to a client's raise. Closest to the original
   design intent, most work.
2. **Keep them separate by audience.** CC Access for CC-level members (resources,
   prospects); the CRM portal for investors in a specific raise. Requires a clear rule
   about who registers where, and accepts that some people will have both.
3. **Retire one.** Cheapest, but loses whichever set of features is discarded.

**This is on the November path** — client one's investors have to log in somewhere, and
which system they use determines what gets built in October.

### 5. CC Investor Program — **OPERATIONAL. Separate. Not in scope for IAM.**

| Field | Value |
|---|---|
| **Purpose** | Acquisition of Capital Context's own client prospects |
| **State** | **Operational and in use.** Not a work in progress |
| **Built components** | Apollo join · NeverBounce email verification · Reg D integration · LLM reading company websites for fit |
| **Relationship to IAM** | **None. Stays separate.** Do not merge, do not refactor, do not make IAM a dependency of it |
| **Owner** | John White |

**Decision, 2026-08-01: this system stays as it is.** An earlier draft of this document
suggested folding it into IAM as a fifth capital-source category. That was wrong. The
overlap in machinery is real, but this system works and IAM does not yet exist —
absorbing a running system into an unbuilt one trades certainty for theory. It is off the
IAM roadmap entirely.

**What it is still useful for: proven components and validated patterns.** Three things
in it bear directly on open IAM questions, as reference rather than as shared code:

- **NeverBounce is already integrated here.** That closes IAM's open email-verification
  question — the vendor decision is made, and Phase S records land `is_verified = false`
  precisely so a verification pass can set them later. Same vendor, separate integration.
- **LLM-reads-website-for-fit is a pattern you have already validated in production.**
  IAM Phase 2b needs exactly this for RIA websites and Part 2A narrative. Worth looking
  at what worked and what didn't before that prompt is submitted, rather than
  rediscovering it.
- **Reg D integration** — relevant context for how accreditation and exemption are
  handled downstream, when IAM eventually reaches that.

### 6+ — other modules

*Add rows. Anything with a spec, a repo, or a Claude Code session attached to it counts
as a module, including things that feel too small to list.*

---

## The dependency cycle, as far as I can infer it

From the IAM specification, the flow between modules is:

```
Investment Development
    │  produces a structured offering (terms, strategy, geography, minimums)
    ▼
IAM — fit engine scores the Universe against that offering
    │  produces prioritised, qualified prospects
    ▼
Capital Raising Module — runs campaigns, meetings, due diligence, subscription
    │  produces behavioural and outcome events
    ▼
IAM — outcome learning improves future qualification and fit
```

This is stated in the spec itself (Part I §3.9, §3.10, Part VI), so it is not
speculation. Two consequences:

- **Investment Development is upstream of IAM's fit engine**, not parallel to it. The fit
  engine cannot score anything until an approved offering profile exists.
- **The Capital Raising Module is both a consumer and a producer** for IAM. It receives
  campaign records and returns behaviour. That two-way contract is worth defining once,
  early, rather than discovering it twice.

---

## What the November 1 date actually requires

Not everything needs to be finished. Working backwards from *client one launches
outreach*:

| Required | Status | Note |
|---|---|---|
| A universe of reachable prospects | IAM Phase S, **Aug 15** | On track |
| A structured offering profile for client one | Investment Development | **Unknown — this is the gap I cannot see** |
| Ability to run a campaign | Capital Raising Module | Unknown state |
| A way to pick who to contact | IAM Phase 5 fit engine | **Optional — see below** |

**The fit engine is not on the critical path for the first raise.** For one offering and
a few hundred targets, you can hand-select from the Universe using SQL and your own
judgment. That is what you would do anyway to sanity-check the fit engine's output. It
takes Phase 5 — 15–25 days — off the November path entirely and moves it to Q1, where it
belongs once you have outcome data to calibrate against.

That leaves the real November question: **what state are Investment Development and the
Capital Raising Module actually in?** Those are the two I cannot see, and between them
they determine whether the date holds.

---

## How to use this

1. Fill in modules 2–6. Rough is fine; "nothing yet" is a valid and useful answer.
2. For each, note **where the artifacts physically are** — repo URL, folder, document,
   or "in a Claude chat somewhere." Fragmentation is the stated problem and this is the
   line that fixes it.
3. Mark each module as on or off the November critical path.
4. Then sequence: critical path first, dependencies respected, one module at a time
   through the same phase-and-review discipline IAM is using.

Bring it back populated and I will work the schedule against it.
