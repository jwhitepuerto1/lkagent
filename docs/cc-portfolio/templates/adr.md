# <Program> — Architecture Decision Record

Status: proposed | **accepted** <date> | provisional
Context document: `<spec filename>`

Aim for three to five ADRs. More than that and they stop being load-bearing decisions and
start being documentation.

---

## ADR-001 — <one-line decision, stated as a claim>

### Context

What situation forces a choice. Name the specific constraint — a spec requirement, an
existing codebase, a vendor's terms. If you cannot name what forces the choice, this is
not an ADR.

### Decision

What was decided, unambiguously. Written so someone can tell whether code violates it.

### Rationale

Why, in bullets. Include the argument you found least comfortable — if every bullet
supports the decision, the analysis was not honest.

### Consequences

What this costs. Every real decision costs something; if you cannot name the cost, you
have not understood the decision.

### Reversal

**How cheaply does this reverse, and until when?**

Mandatory. Examples:
- *"Cheap before Phase 1a, expensive after — it determines the schema."*
- *"Reversible any time; one config change."*
- *"Effectively permanent once production data exists."*

An ADR without this line gets defended past its usefulness, because nobody knows what
reopening it would cost.

---

## ADR-002 — <...>

*(repeat)*

---

## Writing the case against

For any ADR you are less than confident about, write the strongest opposing case **before**
accepting it — as a separate document, argued properly rather than strawmanned.

On the IAM this changed the answer: writing the case against ADR-003 surfaced a third
option that fitted the specification better than either position originally considered,
and the ADR was downgraded to provisional as a result.

If the opposing case is easy to write and unconvincing, you have confirmed the decision at
low cost. If it is hard to dismiss, you have found something before it became expensive.
