# Phase 1d — Governance, Orchestration, and Gateway

**Prerequisite:** Phase 1c reviewed, tests passing, committed.
**Covers shared components:** 10 (Workflow Orchestration), 11 (Human Review Queue),
12 (Evidence Audit Service), 13 (Suppression and Contact Governance), 14 (Behavioral
Event Ingestion), 15 (Client Export Gateway), 16 (Capital-Source Assignment and Conflict
Management).
**Goal of this phase:** the control layer. After this, the shared foundation is complete
and Phase 2 (RIA) can begin.

---

## Prompt

```
You are continuing the Capital Context IAS Investor Acquisition Module (IAS IAM).

Phases 1a to 1c delivered persistence, the evidence ledger, and the scoring and agent
frameworks. This is Phase 1d, the final phase of the shared foundation. Read CLAUDE.md
and the prior phase documents before starting.

Scope: orchestration, human oversight, adversarial audit, suppression, behavioural
intake, controlled export, and multi-raise conflict management.

SCOPE OF THIS PHASE

1. Workflow Orchestration (shared component 10)
   PostgreSQL-backed job queue. Do not introduce Temporal.

   Implement event-driven workflows for:
     candidate.discovered, source.record.updated, identity.resolved, evidence.updated,
     category.assessment.required, capital_source.qualified, offering.created,
     offering.updated, offering.approved, fit.recalculation.required,
     campaign.behavior.received, verification.updated, subscription.updated,
     capital.funded, suppression.updated

   Also support the fuller event topic list in Part VII of the specification:
     source.record.created, person.identity.updated, organization.identity.updated,
     evidence.created, evidence.expired, evidence.contradicted,
     capital_source.disqualified, capital_source.requalification_due,
     offering.profile.approved, offering.profile.changed, offering.fit.calculated,
     assignment.created, assignment.changed, due_diligence.started,
     suppression.created, suppression.removed

   Requirements:
   - Idempotency keys on every job. An identical completed job never runs twice.
   - Recalculation triggers per Part VII: recalculate category qualification when
     critical evidence is added, evidence expires, identity changes, registration
     changes, employer changes, decision-maker changes, a contradiction is found, or
     verification status changes.
   - Retries with backoff, a dead-letter path, and no silent job loss.
   - Daily incremental update capability, recording separately: last source checked,
     last record changed, last agent assessment, last score calculated, last human
     review.

2. Human Review Queue (shared component 11)
   Route to human review: identity conflicts, material contradictions, high-value but
   incomplete records, first entry into a high-priority qualification band, records
   relying heavily on modelled financial estimates, uncertain family-office
   classification, uncertain RIA third-party accessibility, offering-document conflicts,
   and campaign conflicts among active raises.

   A review decision is recorded, attributable, and reversible, and it feeds back into
   the record's state. Reviews have SLAs and the queue exposes ageing.

3. Evidence Audit Service (shared component 12)
   A separate audit agent that challenges high qualification and fit results. It is
   adversarial by design: its job is to find the reason a strong result is wrong.

   It must check for: mistaken identity, duplicate evidence, stale data, unsupported
   assumptions, vendor estimates represented as facts, public real estate confused with
   private real estate, fund management confused with allocation activity, employee title
   confused with authority, gross property value confused with equity, proprietary
   products confused with third-party accessibility, and conflicting source information.

   The audit service may flag and may block promotion. Consistent with Phase 1c, it may
   not compute a production score.

4. Suppression and Contact Governance (shared component 13)
   Suppression always wins. No agent, no override, no export path may bypass an active
   suppression. Support suppression at person, organization, and contact-point level,
   with reason, source, effective dates, and provenance. Contact validation and
   reachability primitives live here.

5. Behavioral Event Ingestion (shared component 14)
   Accept permitted behavioural and outcome events from client campaigns: email reply,
   internal referral, meeting booked, meeting completed, resource download, portal
   registration, due diligence request, data-room activity, accreditation verification
   started, accreditation verification completed, subscription started, subscription
   completed, capital funded, decline reason, future-interest indication.

   Behaviour MUST affect: current intent, timing, decision-path knowledge, offering fit,
   campaign priority.

   Behaviour MUST NOT independently establish: accreditation, family-office authenticity,
   RIA alternatives capability, or legal eligibility. Enforce this structurally and test
   it.

   Events are idempotent. The same event is never processed twice.

6. Client Export Gateway (shared component 15)
   The only path by which data leaves this service for a client.

   Export only when: category qualification is current, evidence quality meets the
   minimum, offering fit meets the minimum, no hard restriction exists, no active
   suppression exists, assignment and overlap rules permit routing, and a relevant
   contact or decision-maker path exists.

   The export payload may contain only: identity, contact details, category, general
   qualification band, offering fit, relevant reason codes, outreach priority,
   recommended message angle, decision-maker role, campaign status.

   The export payload must NEVER contain: internal source contracts or licensing
   information, detailed modelled wealth estimates, another client's campaign activity,
   another sponsor's offering history, restricted evidence, or internal model features.

   Implement this as an allow-list, not a deny-list. A new internal field must not become
   exportable by default. Test that adding a field to an internal model does not change
   the export surface.

   PROVENANCE GATING — the allow-list filters on source, not only on field name.

   Every contact point and every evidence-derived value carries the source it came from,
   and every source carries a permitted-use classification set in the Phase 1b source
   registry, including whether onward disclosure to a client is permitted.

   The gateway must evaluate both: a field may be on the allow-list and still be withheld
   because the source that produced it is not redistributable. Withholding is silent to
   the client but recorded internally, with the reason.

   The gateway must also be able to answer, for any export payload it produced, which
   sources contributed to it. This is what makes the source registry's permitted-use
   classification enforceable rather than advisory, and it is what allows a source whose
   terms later change to be handled by reclassifying the source rather than by reworking
   the gateway.

   Where withholding a contact point would leave a capital source with no exportable
   contact path, the record fails the "relevant contact or decision-maker path exists"
   condition above and is not exported at all. It must not be exported with an empty
   contact.

7. Capital-Source Assignment and Conflict Management (shared component 16)
   Support approximately five concurrent active raises.

   Statuses: available, assigned, multi_offer_eligible, active_conversation,
   due_diligence, cooling_period, relationship_protected, suppressed.

   Rules: do not send materially competing offerings to the same investor
   simultaneously; prioritise the offering with the highest fit score; protect capital
   sources in active due diligence; consider relationship maturity and check-size
   allocation capacity; permit multiple opportunities only when appropriate and
   supported by evidence; record every assignment decision; allow authorised manual
   override with a recorded reason; never expose one client's activity to another.

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement any HNW, Family Office, RIA, or Offering Fit category logic. Do not
implement the external integrations (SuiteCRM, Mautic, Smartlead, LinkedIn, investor
portal, verification provider) — define their interfaces only. Those are Phase 6.

TESTS

Provide unit and integration tests confirming that:
- an identical completed job does not run twice
- a failed job retries, then dead-letters, and is never silently lost
- each recalculation trigger in Part VII actually fires a recalculation
- suppression blocks export
- suppression cannot be overridden by an agent or by a manual override path
- a behavioural event alone does not establish accreditation
- a behavioural event alone does not establish family-office authenticity
- the same behavioural event processed twice has the effect of once
- an export omits every prohibited field
- adding a new internal field does not add it to the export surface
- a contact point whose source is marked not-redistributable never appears in an export
  payload, even though contact details are an allowed field
- reclassifying a source as not-redistributable changes the export surface with no code
  change
- a capital source whose only contact path is withheld on provenance grounds is not
  exported at all, rather than exported with an empty contact
- the gateway can report which sources contributed to a given export payload
- a provenance withholding is recorded internally with its reason
- two clients cannot observe one another's campaign behaviour
- active due diligence protects a capital source from conflicting outreach
- competing offerings are not routed to the same investor simultaneously
- a manual override is recorded with actor and reason
- assignment history is preserved across status changes
- the audit service can block promotion of a high-scoring but poorly-evidenced record

DELIVERABLES

migrations (if any), all seven services, FastAPI endpoints for the full shared
foundation, the role and permission matrix updated for the new surfaces, unit and
integration tests, API documentation, an operational runbook, security notes, and an
updated docs/assumptions.md.

Also deliver a short readiness statement: which of the four category submodules can now
be started, and what interfaces they must implement.

Before writing code, summarise your export allow-list design and your conflict-resolution
rules for the five-raise case, and wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] Export is an allow-list — add a test field to an internal model and confirm it does
      not appear in an export
- [ ] Provenance gating works both ways: reclassify a source as not-redistributable and
      confirm the export surface changes without a code change, then reclassify it back
- [ ] Ask the gateway which sources contributed to a payload — if it cannot answer, the
      source registry's permitted-use classification is decorative
- [ ] Suppression cannot be bypassed by any path, including manual override
- [ ] Client isolation is tested with two real client fixtures, not asserted
- [ ] The behavioural-events-do-not-establish-accreditation rule is structural
- [ ] Idempotency is verified by replaying a real event stream
- [ ] Every recalculation trigger in Part VII has a test
- [ ] Dead-letter handling exists and is observable
- [ ] The audit service can actually block, not merely annotate
- [ ] Runbook covers: daily update failure, agent provider outage, migration rollback,
      and stuck-job recovery
- [ ] Foundation is complete: all 20 shared components now implemented across 1a–1d
