# Phase 2b — Allocator Qualification

**Prerequisite:** Phase 2a reviewed, tests passing, committed.
**Covers agents:** 5 (Relevant Client Base), 6 (Private Alternatives Allocation),
7 (Private Real Estate Affinity), 8 (Third-Party Sponsor Accessibility),
9 (Competitive Conflict).
**Goal of this phase:** determine whether a firm actually allocates client capital to
non-public alternatives, has private real estate interest, and can consider an outside
sponsor.

**This is the phase that decides whether the submodule is right or useless.** Review it
harder than the others.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phase 2a delivered regulatory ingestion, firm entity resolution, registration status, and
ADV data quality. This is Phase 2b. Read CLAUDE.md and all prior phase documents before
starting.

Scope: the assessments that determine whether an RIA firm is a genuine prospect.

THE CENTRAL CORRECTION — READ THIS TWICE

The target is NOT primarily RIAs that advise or manage private funds. Private-fund
management is supporting, competitive, or exclusion evidence.

The two qualifying questions are:
  1. Does the RIA allocate or advise CLIENT capital into non-public alternative
     investments?
  2. Does the RIA have evidence of private real estate interest or allocation?

Large AUM is not qualification. Liquid alternatives are not private alternatives. Public
REIT exposure is not private real estate. Managing one's own private fund is not
allocating client capital to third-party sponsors. Four of this phase's five agents exist
specifically to hold these distinctions. A design that collapses any of them produces a
large, confident list of the wrong firms.

Every assessment in this phase must distinguish three states: evidence supports,
evidence contradicts, and evidence is absent. Absent is never treated as supports, and
per the Phase 1c rule, absent reduces coverage rather than defaulting to a neutral score.

SCOPE OF THIS PHASE

1. Relevant Client Base Agent (agent 5)
   - Evaluate HNW, UHNW, family, trust, estate, and qualified-client relevance from ADV
     Part 1 client category and account data.
   - Evaluate discretionary authority and practical account capacity — a firm with
     discretion over client assets is operationally different from one that must seek
     per-client approval, and both are relevant but not equivalent.
   - Reason codes: HNW_CLIENT_BASE, DISCRETIONARY_CLIENT_ASSETS.
   - Note: client counts and asset figures in ADV are self-reported and bucketed. Model
     the imprecision; do not present a bucket as a point estimate.

2. Private Alternatives Allocation Agent (agent 6)
   Determine whether the firm recommends or allocates client capital to: private equity,
   private credit, venture capital, hedge funds, private funds, private real estate,
   direct private investments, limited partnerships, and other non-public alternatives.

   MUST distinguish private alternatives from liquid alternatives. An interval fund, a
   liquid alts mutual fund, a managed futures product, or a publicly traded BDC is NOT
   evidence of private alternatives allocation capability.

   Reason codes: CONFIRMED_PRIVATE_ALTERNATIVES_ALLOCATOR (direct evidence),
   PROBABLE_PRIVATE_ALTERNATIVES_ALLOCATOR (indirect but corroborated),
   LIQUID_ALTERNATIVES_ONLY (exclusionary finding).

   Phase 2d gates this at >= 65. It carries 30% of the RIA score, the largest single
   weight. Precision here matters more than recall.

3. Private Real Estate Affinity Agent (agent 7)
   Determine whether private real estate is used or considered.

   MUST distinguish private real estate from public REIT exposure. Holding a REIT ETF is
   not private real estate allocation and must never be scored as such.

   Produce vectors for: property type, strategy, structure, geography, income orientation,
   liquidity requirement, and risk tolerance. These feed offering fit in Phase 5, so they
   must be structured, not prose.

   Reason codes: PRIVATE_CRE_ALLOCATOR, PRIVATE_REAL_ESTATE_INTEREST,
   PRIVATE_REAL_ESTATE_DEBT, PUBLIC_REIT_ONLY (exclusionary finding).

   Phase 2d gates this at >= 60. It carries 25% of the RIA score.

4. Third-Party Sponsor Accessibility Agent (agent 8)
   Determine whether the firm can actually consider an outside CRE sponsor. Assess: open
   architecture, approved product lists, committee approval requirements, platform
   requirements, manager size minimums, track record minimums, custody constraints,
   reporting requirements, and emerging-manager willingness.

   A firm that allocates heavily to private alternatives but only through a closed
   platform, or that requires a ten-year track record and $500M AUM from a sponsor, is
   inaccessible in practice regardless of how good its allocation profile looks.

   Reason codes: THIRD_PARTY_MANAGER_ACCESSIBLE, OPEN_ARCHITECTURE,
   CENTRAL_APPROVAL_REQUIRED.

   Phase 2d gates this at >= 50. It carries 15% of the RIA score.

5. Competitive Conflict Agent (agent 9)
   Classify each firm as exactly one of:
     third_party_allocator
     proprietary_and_third_party_allocator
     proprietary_products_only
     private_fund_manager_only
     cre_sponsor_competitor
     uncertain

   Hard rule from the specification: a firm remains qualified only when SEPARATE evidence
   supports external client allocations. Evidence that a firm runs private funds does not
   double as evidence that it allocates to third parties. The two findings must rest on
   distinct evidence items, and the system must be able to show which evidence supports
   which.

   Reason codes: PROPRIETARY_PRODUCTS_ONLY, PRIVATE_FUND_MANAGER_ONLY,
   CRE_SPONSOR_COMPETITOR.

   A firm classified proprietary_products_only fails a Phase 2d hard gate. A firm
   classified cre_sponsor_competitor is a competitor and must be flagged as such rather
   than silently dropped — that information is useful.

6. Deterministic scoring services
   Per the Phase 1c invariant, the agents above extract and classify evidence. They do NOT
   produce scores. Implement separate deterministic, version-controlled scoring services
   for: relevant client base, private alternatives allocation, private real estate
   affinity, and third-party accessibility. Each is a pure function of features, evidence,
   configuration, and model version, and each emits its contributing reason codes.

7. Data model
   Create and migrate:
     - ria_client_composition
     - ria_allocator_assessment
     - ria_private_real_estate_assessment
     - ria_accessibility_assessment

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement: employee or adviser identity resolution, role classification, authority
classification, decision-path mapping, contact validation, the evidence audit agent, the
overall RIA qualification score, or hard gate evaluation. Those are Phases 2c and 2d.

Do not emit reason codes belonging to other phases.

TESTS

Provide unit and integration tests confirming that:
- large AUM alone does not qualify a firm
- a firm holding only liquid alternatives scores LIQUID_ALTERNATIVES_ONLY and fails the
  private alternatives threshold
- an interval fund or liquid alts mutual fund is not counted as private alternatives
- public REIT exposure alone yields PUBLIC_REIT_ONLY and does not prove private real
  estate allocation
- a REIT ETF holding never contributes to private real estate affinity
- private-fund management alone does not establish third-party allocation, and the two
  findings rest on distinct evidence items
- a proprietary_products_only firm is classified as such
- a cre_sponsor_competitor is flagged rather than silently dropped
- a firm with strong allocation evidence but a closed platform scores low on accessibility
- absent evidence reduces coverage and never counts as positive
- each scoring service is reproducible: identical inputs and version produce identical output
- each score persists its model version
- ADV bucketed figures are not presented as point estimates

Include at least three end-to-end fixtures built from realistic ADV shapes: one clear
qualifier, one large-AUM firm that should NOT qualify, and one private fund manager that
should NOT qualify.

DELIVERABLES

migrations, models, Pydantic contracts, agent prompts, four deterministic scoring
services, workflow wiring, API endpoints, unit tests, integration tests, the three
end-to-end fixtures, documentation of how each distinction is drawn and on what evidence,
and an updated docs/assumptions.md.

Before writing code, explain in detail how you will distinguish (a) private from liquid
alternatives, (b) private real estate from public REIT exposure, and (c) fund management
from third-party allocation — naming the specific ADV fields, Part 2A language patterns,
and other evidence you will rely on for each. Then wait for confirmation.
```

---

## Review checklist before accepting this phase

This is the phase where a plausible-looking implementation can be quietly wrong. Spend
the time.

- [ ] Hand-check the three end-to-end fixtures yourself. Do you agree with each verdict?
- [ ] Pick five real firms you know well and run them. Do the classifications match your
      own judgment? This is worth more than any unit test.
- [ ] Confirm liquid alts are genuinely excluded — inspect what evidence the private
      alternatives score actually rested on for a passing firm
- [ ] Confirm a REIT ETF holding cannot reach the private real estate score by any path
- [ ] Verify that fund management and third-party allocation rest on *distinct* evidence
      items, and that the system can show you which is which
- [ ] Check that accessibility can veto an otherwise attractive firm
- [ ] Confirm absent evidence reduces coverage rather than scoring neutral
- [ ] Confirm no agent produces a score
- [ ] Check that ADV's self-reported, bucketed nature is represented honestly
- [ ] Competitors are flagged and retained, not dropped
