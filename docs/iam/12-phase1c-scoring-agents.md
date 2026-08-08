# Phase 1c — Scoring and Agents

**Prerequisite:** Phase 1b reviewed, tests passing, committed.
**Covers shared components:** 6 (Feature Registry), 7 (Deterministic Scoring Framework),
8 (Agent Execution Framework), 9 (Agent JSON Validation), 17 (Model Registry and
Versioning).
**Goal of this phase:** evidence → features → deterministic scores, with LLM agents able
to classify evidence but structurally unable to score. This phase implements the single
most important invariant in the system.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phases 1a and 1b delivered persistence and the evidence ledger. This is Phase 1c. Read
CLAUDE.md and the prior phase documents before starting.

Scope: turning stored evidence into deterministic scores, and providing the agent
framework that extracts and classifies evidence. This phase establishes the boundary
between what LLMs may do and what they may not.

THE CENTRAL INVARIANT

LLM agents may identify, extract, and classify evidence.
LLM agents must NEVER calculate a final production score.
All production scores are calculated by deterministic, version-controlled Python
services that take evidence and features as input and are reproducible given the same
inputs and the same model version.

This must be enforced by architecture, not by instruction. An agent must not have a code
path by which a score reaches a production field. Demonstrate how the design makes this
impossible and test it.

SCOPE OF THIS PHASE

1. Feature Registry (shared component 6)
   Named, versioned, typed feature definitions computed from evidence. Each definition
   records: its inputs, its computation, its version, its validity period, and whether a
   missing input yields "unknown" rather than a default.

   Hard rule: unknown is never silently coerced to zero or to a neutral value. Unknown
   must remain distinguishable downstream, because coverage calculations depend on it.

   Feature values persist to person_feature_value and organization_feature_value with
   the feature version that produced them.

2. Deterministic Scoring Framework (shared component 7)
   A framework — not the category-specific scorers, which come in Phases 2 to 5 — for
   defining scoring services that are:
     - pure functions of (features, evidence, configuration, model version)
     - reproducible: identical inputs and version always produce identical output
     - explainable: every score emits its contributing reason codes
     - versioned: the model version is persisted alongside every score
     - snapshotted: recalculation writes a new immutable snapshot

   The framework must support the score types the specification names: accreditation
   probability, family-office authenticity, RIA allocator qualification,
   alternative-investment propensity, private real estate affinity, capital capability,
   decision-maker relevance, offering fit, operational priority. Provide the
   registration mechanism and one reference implementation against synthetic data.
   Do NOT implement the real category scorers.

   Implement the shared band vocabulary:
     85-100 core qualified, 75-84.99 strong qualified, 70-74.99 qualified,
     60-69.99 further research, below 60 not active-universe qualified.

   Implement the general fit formula as a reusable primitive:
     Known Weighted Match = Sum(weight x match x confidence x known)
                            / Sum(weight x confidence x known)
     Coverage             = Sum(weight x confidence x known) / Sum(all weights)
     Adjusted Fit         = 100 x Known Weighted Match x (0.60 + 0.40 x Coverage)

3. Model Registry and Versioning (shared component 17)
   Register every scoring model and every agent prompt with a version, an effective
   date, and a changelog. A score is never stored without the version that produced it.
   Support running a new model version in shadow against historical inputs without
   affecting production scores.

4. Agent Execution Framework (shared component 8)
   Every agent uses a standard request and response envelope. Every agent result
   includes:
     agent name, agent version, contract version, run ID, input hash, status,
     evidence references, warnings, output payload, model provider, model name,
     prompt version, generation timestamp.

   Allowed statuses: complete, partial, insufficient_evidence, contradictory, failed.

   Persist every run to agent_run, including inputs, outputs, and cost/latency, so that
   agent behaviour is auditable and replayable.

5. Agent JSON Input and Output Validation (shared component 9)
   Reject agent outputs that:
     - fail schema validation
     - contain unsupported claims (claims with no evidence reference)
     - omit evidence references
     - attempt to declare legal verification
     - attempt to override suppression
     - attempt to calculate an unapproved production score

   Rejection is not a warning. A rejected output does not reach persistence. Every
   rejection is recorded with its reason.

   Use only the approved LLM provider, configured by environment. No provider
   credentials in source.

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement: workflow orchestration, the human review queue, the evidence audit
service, suppression enforcement, behavioural events, the export gateway, or assignment
and conflict logic. Do not implement any HNW, Family Office, RIA, or Offering Fit
category scorer or agent — only the frameworks they will plug into.

TESTS

Provide unit and integration tests confirming that:
- an agent output containing a production score is rejected
- an agent output with a claim lacking an evidence reference is rejected
- an agent output asserting legal verification is rejected
- an agent output attempting to override suppression is rejected
- a malformed agent output never reaches persistence
- a scoring service given identical inputs and version produces identical output
- a score is never persisted without a model version
- recalculation creates a new snapshot and leaves prior snapshots byte-identical
- a missing feature input yields unknown, not zero
- unknown inputs reduce coverage and therefore reduce adjusted fit
- the fit formula matches worked examples computed by hand (include the worked examples)
- band boundaries are correct at the exact edges (60, 70, 75, 85)
- a shadow model version does not affect production scores

DELIVERABLES

migrations (if any), the feature registry, the scoring framework and one reference
scorer, the model registry, the agent framework, the validation layer, API endpoints,
unit tests, integration tests, documentation of how the LLM/scoring boundary is
architecturally enforced, and an updated docs/assumptions.md.

Before writing code, explain how your design makes it structurally impossible for an
agent to write a production score, and wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] The LLM/scoring separation is architectural — trace the code path yourself and
      confirm there is no route from agent output to a score field
- [ ] Reproducibility test is real: run a scorer twice, diff the output
- [ ] Band boundary tests hit the exact edges, not just the middles
- [ ] The fit formula is verified against hand-computed examples
- [ ] Unknown is genuinely distinct from zero everywhere it appears
- [ ] Snapshots are immutable — attempt to mutate one and confirm it fails
- [ ] Every rejection reason from the specification's list has a corresponding test
- [ ] No category-specific scorer has been implemented
- [ ] No provider credentials anywhere in the repository
