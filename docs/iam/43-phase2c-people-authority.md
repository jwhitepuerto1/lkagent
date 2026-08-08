# Phase 2c — People, Roles, Authority, and Decision Paths

**Prerequisite:** Phase 2b reviewed, tests passing, committed.
**Covers agents:** 10 (RIA Employee Identity), 11 (Employee Role Classification),
12 (Investment Authority), 13 (RIA Decision-Path), 14 (Contact and Reachability).
**Goal of this phase:** identify who at a qualified firm can actually approve, recommend,
or introduce — and map how a decision travels through the firm.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phase 2b delivered firm-level allocator qualification. This is Phase 2c. Read CLAUDE.md
and all prior phase documents before starting.

Scope: the people at an RIA firm, their roles, their actual authority, the firm's
decision path, and validated contact routes.

THE CENTRAL DISTINCTION

A title is not authority. "Senior Vice President" tells you nothing about whether someone
can get a CRE offering onto an approved product list. The Investment Authority Agent must
rest on evidence of what a person actually does or decides, not on what their business
card says. The specification's evidence audit explicitly lists "employee title confused
with authority" as a failure mode to catch.

Second: people leave. Employment currency is a first-class concern, not a data-hygiene
afterthought. A departed adviser routed into a campaign is worse than no adviser at all.

MODELLING DECISION — CONFIRM BEFORE STARTING

The firm is the capital source. Advisers and employees are decision-makers and access
paths attached to the firm, carrying their own relevance and fit assessments, but they
are NOT independent capital_source records. This preserves the specification's
requirement that firm qualification and adviser qualification remain separate, while
keeping the capital — which belongs to the advisers' clients — attributed to the firm.

If this is wrong, stop and say so before writing code.

SCOPE OF THIS PHASE

1. Source registration
   Register in the Phase 1b source registry, subject to the licensing decisions made in
   Phase 0: RIA websites, team biographies, approved commercial contact sources, and
   FINRA BrokerCheck if and only if it has been approved. If BrokerCheck has not been
   approved, do not implement against it and note the gap.

2. RIA Employee Identity Agent (agent 10)
   Resolve advisers, owners, executives, researchers, portfolio managers, committee
   members, and other relevant professionals into `person` records from Phase 1a, linked
   to the firm.

   Use IAPD individual records and CRD numbers where available — they are authoritative.
   Website team pages are supporting evidence and are frequently stale.

   Apply the Phase 1b rule: no merging on name similarity alone. Common names at large
   firms are a real hazard here.

   Every person-firm link carries an employment period with a start, an optional end, and
   the evidence and date supporting currency.

3. Employee Role Classification Agent (agent 11)
   Classify each person as one or more of: CIO, alternatives, real assets, private
   markets, portfolio management, due diligence, senior adviser, founder, compliance,
   operations, marketing, irrelevant.

   Classifying someone irrelevant is a useful, positive outcome. Most people at a firm
   are irrelevant to a CRE allocation decision and should be marked so rather than
   retained as noise.

   Reason codes: CIO_IDENTIFIED, ALTERNATIVES_DIRECTOR_IDENTIFIED,
   SENIOR_ADVISER_IDENTIFIED, INVESTMENT_COMMITTEE_IDENTIFIED.

4. Investment Authority Agent (agent 12)
   Classify each relevant person's authority as one of:
     final_decision, investment_committee_vote, product_approval,
     research_recommendation, client_allocation_decision, due_diligence,
     adviser_influence, gatekeeper, introduction_path, no_relevant_authority

   Authority must rest on evidence of function, not on title. State explicitly, per
   classification, what evidence supports it. Where only a title is available, the
   correct output is low confidence, not an inferred authority level.

   Reason code: NO_RELEVANT_DECISION_MAKER where a firm has no one with relevant
   authority. This fails a hard gate in Phase 2d, so it must be reachable and correct.

5. RIA Decision-Path Agent (agent 13)
   Map the firm's process from initial review through due diligence, product approval,
   and client recommendation. Identify at each stage who participates and in what
   capacity.

   Firms differ structurally: a solo adviser with discretion has a one-step path; a firm
   with a central investment committee and an approved product list has four or five,
   and the entry point is a research analyst rather than the adviser holding the client
   relationship. Getting this wrong means approaching the wrong person correctly.

   Where the path is unknown, say so. An unknown decision path reduces coverage — it is
   not an assumed simple path.

   Persist to `ria_decision_path`.

6. Contact and Reachability Agent (agent 14)
   Validate professional contact information and current employment. Link every contact
   point to the person's role and authority, per the Phase 1a contact_point model.

   Enforce Phase 1d suppression. Suppression always wins; a suppressed contact is never
   returned as reachable by any path.

   Produce a reachability score. Phase 2d and the campaign priority rules in Phase 5
   both depend on it.

7. Deterministic scoring
   Per the Phase 1c invariant, agents classify; they do not score. Implement deterministic
   services for decision-maker coverage (10% of the RIA score) and reachability.

   Decision-maker coverage is a firm-level measure of whether the right people have been
   found, not a per-person measure.

8. Data model
   Create and migrate:
     - ria_person_responsibility
     - ria_decision_path

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement: the evidence audit agent, the overall RIA qualification score, hard gate
evaluation, publication of qualified records, or any offering-fit logic. Those are Phase
2d and Phase 5.

TESTS

Provide unit and integration tests confirming that:
- an adviser title alone does not establish authority
- a person with only a title and no functional evidence receives low authority confidence,
  not an inferred authority level
- departed employees are not selected as decision-makers
- an employment end date removes a person from current decision-maker consideration
- two people with the same name at the same large firm are not merged without a
  corroborating identifier
- a person resolved by CRD takes precedence over a website team-page match
- classifying a person irrelevant is persisted as a finding, not a null
- a firm with no relevant authority yields NO_RELEVANT_DECISION_MAKER
- an unknown decision path reduces coverage and is not treated as a simple path
- a suppressed contact is never returned as reachable
- decision-maker coverage is computed at firm level
- a solo-adviser firm and a committee-driven firm produce structurally different
  decision paths

Include fixtures for at least: a solo adviser with discretion, a mid-size firm with an
investment committee, and a firm whose team page lists two people who have left.

DELIVERABLES

migrations, models, Pydantic contracts, agent prompts, employee mapping, role and
authority classification, decision-path mapping, contact validation, deterministic
coverage and reachability scoring, workflow wiring, API endpoints, unit tests,
integration tests, fixtures, documentation, a sample qualified adviser record, and an
updated docs/assumptions.md.

Before writing code, summarise: how you will establish employment currency and with what
evidence, how authority is derived from function rather than title, and how you will
represent an unknown decision path. Then wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] Pick a firm whose team you can verify independently. Are the people right? Are any
      of them gone?
- [ ] Confirm title alone never produces a confident authority classification
- [ ] Check employment currency has real evidence behind it, not just a scrape date
- [ ] Verify a departed employee is genuinely excluded from routing, not merely flagged
- [ ] Confirm the decision path for a committee-driven firm differs structurally from a
      solo adviser's — if they look the same, the agent is not doing its job
- [ ] Unknown decision path reduces coverage rather than defaulting
- [ ] Suppression cannot be bypassed by the reachability path
- [ ] "Irrelevant" is a stored finding, so the work is not redone every cycle
- [ ] Decision-maker coverage is firm-level
- [ ] If BrokerCheck was not licence-approved, confirm nothing depends on it
