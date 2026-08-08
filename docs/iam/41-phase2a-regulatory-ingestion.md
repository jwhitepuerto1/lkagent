# Phase 2a — Regulatory Ingestion and Firm Identity

**Prerequisite:** Phases 1a–1d complete, reviewed, committed. Read
`40-phase2-ria-overview.md` first, and settle its three open questions.
**Covers agents:** 1 (Regulatory Ingestion), 2 (RIA Entity Resolution), 3 (Registration
and Operating Status), 4 (ADV Data Quality).
**Goal of this phase:** regulatory filings in, versioned, resolved to firms, status
classified, quality checked. No qualification judgment yet.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phases 1a to 1d delivered the shared foundation: persistence, source governance,
ingestion, identity resolution, the evidence ledger, the feature registry, the
deterministic scoring framework, the agent framework, workflow orchestration, review,
audit, suppression, and the export gateway.

This is Phase 2a, the first phase of the RIA Allocator Intelligence submodule. Read
CLAUDE.md and all prior phase documents before starting.

Scope: getting regulatory filings into the system as versioned, lineage-complete
evidence, resolved to correctly identified firms, with registration status and data
quality assessed. This phase makes NO judgment about whether a firm is a good prospect.

CONTEXT YOU MUST NOT LOSE

The eventual target is not RIAs that manage private funds. Private-fund management is
supporting, competitive, or exclusion evidence. The qualifying questions, addressed in
Phase 2b, are whether the firm allocates CLIENT capital to non-public alternatives and
whether it has private real estate interest. Do not build anything in this phase that
presumes AUM or fund management implies quality.

SCOPE OF THIS PHASE

1. Source registration
   Before any ingestion, register each source in the Phase 1b source registry with its
   permitted uses, prohibited uses, licensing restrictions, retention requirements,
   refresh schedule, and reliability rating:
     SEC/IAPD, Form ADV Part 1, Form ADV Schedule D, Form ADV Part 2A, Form CRS,
     state adviser sources, IAPD individual records.

   If RIA data has already been assembled outside this system, treat it as a source like
   any other: it must be registered, and its records must carry reconstructed provenance.
   It does not bypass source governance for being in-house.

   Do NOT register FINRA BrokerCheck or commercial contact sources in this phase. Those
   arrive in Phase 2c and are subject to a separate licensing decision.

2. Regulatory Ingestion Agent (agent 1)
   - Version every filing. A filing is immutable once ingested; a new filing is a new
     version, never an overwrite.
   - Identify changed fields between versions, and emit change events only for material
     changes as defined in Phase 1b.
   - Preserve CRD and SEC identifiers verbatim as first-class identifiers.
   - Handle the bulk nature of ADV data: these are periodic full datasets, not record-by-
     record feeds. Design for a full-dataset diff, not for row-level webhooks.
   - Record filing date and collection date separately. They are frequently far apart and
     the distinction matters for staleness.

3. RIA Entity Resolution Agent (agent 2)
   Resolve legal names, DBAs, mergers, affiliates, domains, offices, and related firms
   into `ria_profile` records linked to the shared `organization` entity from Phase 1a.

   Use CRD and SEC numbers as primary identifiers. These are authoritative; prefer them
   over name matching in every case. Per Phase 1b's rule, firms are never merged on name
   similarity alone.

   Produce an entity identity confidence score. Phase 2d's hard gate requires >= 0.95, so
   the score must be meaningful at that threshold, not merely present.

   Represent firm relationships explicitly — affiliate, predecessor, successor, related
   adviser — rather than flattening them into a single record. Mergers and successor
   filings are common in this data.

4. Registration and Operating Status Agent (agent 3)
   Classify each firm as exactly one of:
     active SEC RIA, active state RIA, ERA (exempt reporting adviser), inactive,
     withdrawn, pending, uncertain.

   Emit reason codes ACTIVE_SEC_RIA or ACTIVE_STATE_RIA where applicable.

   Status is time-varying. Model it as a history, not a current-value column: a firm that
   withdraws must not silently lose the record that it was previously active.

5. ADV Data Quality Agent (agent 4)
   - Reconcile AUM, client categories, account counts, related entities, and filing dates.
   - Detect duplicated assets. Assets reported by both an adviser and its affiliate are a
     known double-count and must not inflate a single firm's apparent scale.
   - Detect stale information: a filing well past its expected annual amendment is a
     staleness signal, not a current fact.
   - Flag internal inconsistencies within a filing for review rather than resolving them
     silently.

   Data quality output is evidence about the evidence. It feeds the evidence-quality
   score that Phase 2d gates on at >= 70.

6. Data model
   Create and migrate:
     - ria_profile
     - ria_filing_snapshot
     - ria_reason_code_registry

   Seed ria_reason_code_registry with the complete RIA vocabulary, all 23 codes, even
   though this phase emits only two of them. Later phases emit from the registry and
   invent nothing:
     ACTIVE_SEC_RIA, ACTIVE_STATE_RIA, HNW_CLIENT_BASE, DISCRETIONARY_CLIENT_ASSETS,
     CONFIRMED_PRIVATE_ALTERNATIVES_ALLOCATOR, PROBABLE_PRIVATE_ALTERNATIVES_ALLOCATOR,
     PRIVATE_CRE_ALLOCATOR, PRIVATE_REAL_ESTATE_INTEREST, PRIVATE_REAL_ESTATE_DEBT,
     PUBLIC_REIT_ONLY, LIQUID_ALTERNATIVES_ONLY, THIRD_PARTY_MANAGER_ACCESSIBLE,
     CENTRAL_APPROVAL_REQUIRED, OPEN_ARCHITECTURE, PROPRIETARY_PRODUCTS_ONLY,
     PRIVATE_FUND_MANAGER_ONLY, CRE_SPONSOR_COMPETITOR, CIO_IDENTIFIED,
     ALTERNATIVES_DIRECTOR_IDENTIFIED, SENIOR_ADVISER_IDENTIFIED,
     INVESTMENT_COMMITTEE_IDENTIFIED, NO_RELEVANT_DECISION_MAKER, MATERIAL_CONTRADICTION

   Add RIA-specific evidence claim codes to the Phase 1b claim registry.

7. Workflow and API
   Wire this phase into the Phase 1d orchestration for the events it produces and
   consumes. Endpoints follow the Phase 1a RBAC matrix.

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement: client base assessment, private alternatives allocation, private real
estate affinity, third-party accessibility, competitive conflict classification, employee
or adviser resolution, role or authority classification, decision-path mapping, contact
validation, the evidence audit agent, or the RIA qualification score. No hard gates are
evaluated in this phase.

Do not emit any reason code other than ACTIVE_SEC_RIA and ACTIVE_STATE_RIA.

TESTS

Provide unit and integration tests confirming that:
- an unregistered or unapproved source cannot be ingested (inherited from 1b, retested here)
- re-ingesting an identical filing dataset creates no new filing version
- an amended filing creates a new version and leaves the prior version byte-identical
- CRD and SEC identifiers survive ingestion unaltered
- two firms with similar names and different CRD numbers are not merged
- two filings with the same CRD across a name change resolve to one firm
- a successor firm relationship is represented, not flattened
- entity identity confidence is computed and is discriminating at the 0.95 threshold
- a withdrawn firm retains its history of prior active status
- assets double-reported by an adviser and its affiliate are detected, not summed
- a filing past its expected amendment window is flagged stale
- filing date and collection date are stored and queryable separately
- no reason code outside the seeded registry can be written

DELIVERABLES

migrations, models, Pydantic contracts, agent prompts, the regulatory ingestion pipeline,
entity resolution, status classification, data quality assessment, workflow wiring, API
endpoints, unit tests, integration tests, documentation, a sample ingested filing
snapshot, and an updated docs/assumptions.md.

Before writing code, summarise: your approach to bulk ADV dataset diffing, your entity
resolution strategy and how identity confidence is computed, and how you will represent
firm relationships and status history. Then wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] Filings are genuinely immutable — amend one and confirm the prior version is untouched
- [ ] CRD/SEC identifiers are primary; name matching is subordinate everywhere
- [ ] Identity confidence actually discriminates at 0.95 rather than clustering at 1.0
- [ ] Firm relationships (merger, successor, affiliate) are modelled, not flattened
- [ ] Status is a history, not a mutable column
- [ ] Affiliate asset double-counting is detected — this one is easy to miss and inflates
      every downstream capability judgment
- [ ] Filing date and collection date are distinct throughout
- [ ] All 23 reason codes seeded; only 2 emitted
- [ ] No qualification judgment has leaked into this phase
- [ ] Any already-assembled RIA data went through source governance like anything else
