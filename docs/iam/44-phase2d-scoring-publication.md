# Phase 2d — Audit, Scoring, Gates, and Publication

**Prerequisite:** Phase 2c reviewed, tests passing, committed.
**Covers agents:** 15 (RIA Evidence Audit), 16 (RIA Qualification Service — deterministic,
not an LLM agent).
**Goal of this phase:** challenge the strong results, compute the qualification score,
apply the ten hard gates, and publish qualified RIA firms into the CC Universe. After
this, Phase 2 is complete.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phases 2a to 2c delivered regulatory ingestion, firm allocator qualification, and people,
authority, and decision paths. This is Phase 2d, the final phase of the RIA submodule.
Read CLAUDE.md and all prior phase documents before starting.

Scope: adversarial audit, deterministic qualification scoring, hard gate enforcement, and
publication of qualified records into the CC Universe.

SCOPE OF THIS PHASE

1. RIA Evidence Audit Agent (agent 15)
   An adversarial agent whose job is to find the reason a strong result is wrong. It runs
   against high qualification results, per the Phase 1d evidence audit service.

   It must challenge:
     - alternatives claims that rest on liquid alternatives
     - private real estate claims that rest on public REIT exposure
     - adviser authority inferred from title
     - third-party accessibility asserted without evidence
     - proprietary product programmes misread as open architecture
     - fund management misread as client allocation
     - stale employment
     - stale filings presented as current facts
     - duplicate or double-counted evidence
     - mistaken firm identity, especially across mergers and successor filings

   Consistent with Phase 1c, the audit agent may flag and may block promotion. It may NOT
   compute a production score.

   Emits MATERIAL_CONTRADICTION where it finds an unresolved conflict.

   Findings that cannot be resolved automatically route to the Phase 1d human review
   queue.

2. RIA Qualification Service (agent 16 — deterministic, NOT an LLM agent)
   A deterministic, version-controlled Python service computing the RIA general
   qualification score from the assessments produced in Phases 2b and 2c.

   Initial weights, which must be configuration rather than constants:
     Private alternatives allocation capability   30%
     Private real estate affinity                 25%
     Relevant client base and account capacity    15%
     Third-party sponsor accessibility            15%
     Decision-maker coverage                      10%
     Evidence quality                              5%

   Use the shared band vocabulary from Phase 1c: 85-100 core qualified, 75-84.99 strong
   qualified, 70-74.99 qualified, 60-69.99 further research, below 60 not
   active-universe qualified.

   Persist to ria_qualification_assessment with the model version, a requalification due
   date, and the contributing reason codes. Recalculation writes a new immutable snapshot.

3. Hard qualification gates
   A firm may enter the active RIA Universe only when ALL of the following hold:
     - active registration
     - entity identity confidence >= 0.95
     - relevant client base score >= 60
     - private alternatives allocation score >= 65
     - private real estate affinity score >= 60
     - third-party sponsor accessibility >= 50
     - at least one relevant adviser or decision-maker identified
     - evidence quality >= 70
     - NOT classified proprietary-products-only
     - no active suppression

   Gates are absolute. A high weighted score never compensates for a failed gate. Each
   gate failure is recorded with its reason so a near-miss is diagnosable.

4. Firm and adviser qualification remain separate
   The firm qualification score and any adviser-level assessment are distinct records with
   distinct lifecycles. A strong adviser does not qualify a weak firm, and a strong firm
   does not qualify a departed adviser. The specification requires this explicitly and it
   must be structurally true, not merely conventional.

5. Publication
   Implement the CapitalSourceModule protocol from Phase 1a for the RIA category:
     ingest_candidate, resolve_identity, extract_evidence, calculate_qualification,
     audit_qualification, publish_qualified_record, recalculate_after_event

   Publishing a qualified record emits capital_source.qualified and populates the common
   fields the specification requires of every qualified CC Universe record: canonical ID,
   category, identity confidence, category qualification status, general qualification
   score, private-alternatives score, private real estate score, capital capability or
   account-capacity score, accessibility score, decision-maker coverage, evidence quality,
   reachability, reason codes, limitations, contradictions, last calculated date,
   requalification date, model version, and audit status.

6. Requalification
   Wire the Part VII recalculation triggers for this category: critical evidence added,
   evidence expired, identity changed, registration changed, employer changed,
   decision-maker changed, contradiction found, verification status changed.

7. Data model
   Create and migrate: ria_qualification_assessment.

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement offering-fit logic, ideal investor profiles, assignment, or campaign
routing. Those are Phase 5. This phase produces qualified Universe records; it does not
match them to anything.

TESTS

Provide unit and integration tests confirming that:
- each of the ten hard gates independently blocks entry to the active Universe
- a firm scoring 95 that fails one gate does not enter the Universe
- a proprietary-products-only firm is excluded regardless of score
- a firm without a relevant decision-maker cannot enter an active campaign
- suppression blocks export
- firm qualification and adviser qualification remain separate records with separate
  lifecycles
- the weighted score matches hand-computed worked examples (include them)
- weights are configuration, and changing them changes the score without a code change
- band boundaries are correct at the exact edges (60, 70, 75, 85)
- the audit agent can block promotion of a high-scoring, poorly-evidenced firm
- the audit agent cannot write a score
- an unresolved contradiction routes to human review
- recalculation creates a new snapshot and leaves prior snapshots byte-identical
- each Part VII recalculation trigger fires for this category
- a published record carries every required common field
- a published record's export surface contains no prohibited field (Phase 1d allow-list)

Carry forward the three Phase 2b end-to-end fixtures and add: a firm that passes every
gate, a firm that fails exactly one gate at the boundary, and a firm the audit agent
should block.

DELIVERABLES

migrations, models, Pydantic contracts, the audit agent prompt, the deterministic
qualification service, gate enforcement, the CapitalSourceModule implementation,
requalification wiring, API endpoints, unit tests, integration tests, fixtures,
documentation, a sample qualified RIA firm record, a sample qualified adviser record, a
readiness statement for Phase 3, and an updated docs/assumptions.md.

Before writing code, summarise: how gates are enforced such that a score cannot bypass
them, how firm and adviser qualification are kept structurally separate, and your worked
examples for the weighted score. Then wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] Test each of the ten gates individually — a gate that is never exercised is a gate
      that does not work
- [ ] Confirm a 95-scoring firm with one failed gate is genuinely excluded
- [ ] Verify the weighted score against your own hand calculation for at least two firms
- [ ] Confirm weights live in configuration; change one and watch the score move
- [ ] Band edges tested at exactly 60, 70, 75, 85
- [ ] The audit agent can actually block, and cannot score
- [ ] Firm and adviser records have genuinely separate lifecycles — expire one, confirm
      the other is untouched
- [ ] A published record carries every common field the specification requires
- [ ] Run the export gateway against a published record and inspect the payload yourself
      for prohibited fields
- [ ] Requalification triggers fire — expire a piece of evidence and watch it happen

---

## After this phase

Phase 2 is complete and the first category is live in the CC Universe. Before starting
Phase 3 (Family Office), it is worth pausing to ask what the foundation got wrong.

The RIA submodule is the first real consumer of everything built in 1a–1d. Whatever was
awkward here — a contract that did not fit, a scoring primitive that needed working
around, a workflow event that fired at the wrong time — will be awkward three more times
unless it is fixed now. Fixing the foundation after one consumer is cheap. After four,
it is not.

Split Part IV (Family Office) only after that review, so the split can be informed by
what actually happened rather than by what was planned.
