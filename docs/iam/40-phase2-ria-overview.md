# Phase 2 — RIA Allocator Intelligence: split and coverage

Source: Master Specification Part V, "Prompt 4: Develop the RIA Allocator Intelligence
Submodule".

**Prerequisite: Phases 1a–1d complete.** The RIA submodule implements the
`CapitalSourceModule` protocol defined in Phase 1a and consumes the evidence ledger,
feature registry, scoring framework, agent framework, and export gateway built in
1b–1d. None of it can be built first.

---

## Why RIA is the first submodule

The specification's own Part VIII puts RIA first, and the reasons hold up:

- The source data is public, structured, and versioned by the regulator. Form ADV is a
  filing, not a scrape.
- It is the least encumbered by licensing, which matters because Phase 0's source review
  gates everything.
- It gives the cleanest first test of whether the evidence-ledger-plus-deterministic-
  scoring pattern actually works, before it is pointed at the fuzzier HNW data where
  every input is an inference.
- Part VIII notes the RIA source data "is already being assembled." See the note on
  existing data below.

## The split

Part V is one prompt requesting 16 agents, 10 tables, 23 reason codes, 10 hard gates, a
16-step workflow, 10 tests, and 14 deliverables. Split into four, following the
specification's own workflow order:

| Prompt | Scope | Agents | Tables |
|---|---|---|---|
| 2a | Regulatory ingestion and firm identity | 1, 2, 3, 4 | `ria_profile`, `ria_filing_snapshot`, `ria_reason_code_registry` |
| 2b | Allocator qualification | 5, 6, 7, 8, 9 | `ria_client_composition`, `ria_allocator_assessment`, `ria_private_real_estate_assessment`, `ria_accessibility_assessment` |
| 2c | People, roles, authority, decision paths | 10, 11, 12, 13, 14 | `ria_person_responsibility`, `ria_decision_path` |
| 2d | Audit, scoring, gates, publication | 15, 16 | `ria_qualification_assessment` |

2d carries only two agents but is not the light phase: it holds the deterministic
qualification service, all ten hard gates, the score weights, the audit agent, the
`CapitalSourceModule` implementation, and the cross-cutting tests that only make sense
once the whole pipeline exists.

### Agent coverage

| # | Agent | Phase |
|---|---|---|
| 1 | Regulatory Ingestion Agent | 2a |
| 2 | RIA Entity Resolution Agent | 2a |
| 3 | Registration and Operating Status Agent | 2a |
| 4 | ADV Data Quality Agent | 2a |
| 5 | Relevant Client Base Agent | 2b |
| 6 | Private Alternatives Allocation Agent | 2b |
| 7 | Private Real Estate Affinity Agent | 2b |
| 8 | Third-Party Sponsor Accessibility Agent | 2b |
| 9 | Competitive Conflict Agent | 2b |
| 10 | RIA Employee Identity Agent | 2c |
| 11 | Employee Role Classification Agent | 2c |
| 12 | Investment Authority Agent | 2c |
| 13 | RIA Decision-Path Agent | 2c |
| 14 | Contact and Reachability Agent | 2c |
| 15 | RIA Evidence Audit Agent | 2d |
| 16 | RIA Qualification Service (deterministic, not an agent) | 2d |

### Reason code coverage (23)

- **2a (2):** `ACTIVE_SEC_RIA`, `ACTIVE_STATE_RIA`
- **2b (15):** `HNW_CLIENT_BASE`, `DISCRETIONARY_CLIENT_ASSETS`,
  `CONFIRMED_PRIVATE_ALTERNATIVES_ALLOCATOR`, `PROBABLE_PRIVATE_ALTERNATIVES_ALLOCATOR`,
  `PRIVATE_CRE_ALLOCATOR`, `PRIVATE_REAL_ESTATE_INTEREST`, `PRIVATE_REAL_ESTATE_DEBT`,
  `PUBLIC_REIT_ONLY`, `LIQUID_ALTERNATIVES_ONLY`, `THIRD_PARTY_MANAGER_ACCESSIBLE`,
  `CENTRAL_APPROVAL_REQUIRED`, `OPEN_ARCHITECTURE`, `PROPRIETARY_PRODUCTS_ONLY`,
  `PRIVATE_FUND_MANAGER_ONLY`, `CRE_SPONSOR_COMPETITOR`
- **2c (5):** `CIO_IDENTIFIED`, `ALTERNATIVES_DIRECTOR_IDENTIFIED`,
  `SENIOR_ADVISER_IDENTIFIED`, `INVESTMENT_COMMITTEE_IDENTIFIED`,
  `NO_RELEVANT_DECISION_MAKER`
- **2d (1):** `MATERIAL_CONTRADICTION`

The full vocabulary is seeded in 2a, mirroring how the evidence claim registry was
handled in Phase 1b. Later phases emit codes from it; none invents one.

### Test coverage (Part V lists 10)

| Test | Phase |
|---|---|
| Large AUM alone does not qualify a firm | 2b |
| Public REIT exposure does not prove private real estate allocation | 2b |
| Liquid alternatives do not prove private alternatives capability | 2b |
| Private-fund management does not prove third-party allocation | 2b |
| Proprietary-products-only firms are excluded | 2b (assessment) + 2d (gate) |
| An adviser title alone does not establish authority | 2c |
| Departed employees are not selected | 2c |
| A firm without a relevant decision-maker cannot enter an active campaign | 2d |
| Suppression blocks export | 2d |
| Firm qualification and adviser qualification remain separate | 2d |

---

## Three things to settle before submitting 2a

**1. What "already being assembled" means.** Part VIII says RIA source data is already
being collected. Whatever exists is an ingestion source like any other: it must be
registered in the source registry with permitted uses before it can enter production
ingestion, and it must carry lineage. It does not get a pass for being in-house. Decide
whether it is re-ingested through the Phase 1b pipeline (recommended, for lineage) or
treated as a pre-loaded batch with reconstructed provenance.

**2. Whether an adviser is a capital source or an access path.** The specification is
ambiguous here and it matters for the data model. Part V's primary output lists
"qualified adviser and employee records" alongside firm records, and Part VI asks for
"RIA adviser offering-fit assessments" as a distinct output from RIA firm fit. But the
capital — the money — belongs to the adviser's clients, not the adviser.

The reading these prompts take: **the firm is the capital source; the adviser is a
decision-maker and access path attached to it, carrying their own fit assessment.**
Advisers get `ria_person_responsibility` rows and their own fit scores, but they are not
independent `capital_source` records. This keeps the specification's requirement that
"firm qualification and adviser qualification remain separate" meaningful, and matches
how the family office submodule treats decision-makers.

Confirm or correct this before 2a. Changing it after 2c is expensive.

**3. FINRA BrokerCheck.** The specification says "where appropriate," which is a
licensing question rather than a technical one. Resolve it in the Phase 0 source review
and either register it or drop it from 2c's sources. Don't leave it to Claude Code to
decide what "appropriate" means.

---

## The correction that drives this whole submodule

Part V contains an explicit correction that is easy to lose in the detail, and it is the
single most important thing for a reviewer to hold onto:

> The target is not primarily RIAs that advise or manage private funds. Private-fund
> management is supporting, competitive, or exclusion evidence.

A firm that runs its own private funds may be a competitor, not a customer. A firm with
enormous AUM that allocates none of it to non-public alternatives is worthless here. The
two questions that matter are whether the firm allocates *client* capital to non-public
alternatives, and whether it has private real estate interest.

Four of Phase 2b's five agents exist to draw distinctions that a naive reading collapses:
private alternatives vs. liquid alternatives, private real estate vs. public REIT
exposure, third-party allocation vs. proprietary products, and allocator vs. fund
manager vs. CRE sponsor competitor. If 2b is reviewed casually, the whole submodule
produces a large and confident list of the wrong firms.
