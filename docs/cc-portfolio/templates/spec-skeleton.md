# <Program Name>
## Functional and Development Specification

Version <n> · <date> · Owner: <name>

> Structure derived from the IAS IAM specification, which worked, with the gaps it had
> filled in. Fill it from Stages A–C of `03-greenfield-program-protocol.md`.
>
> **Delete every instruction block like this one before circulating.**

---

# Part I — Purpose

## 1. Problem

*(Stage A1)* One paragraph. What breaks today, for whom, at what cost.

## 2. The questions this system answers

*(Stage A2)* Two or three. Not features — questions.

> The IAM's version: *"Is this person or organization sufficiently identified, supported
> by evidence… qualified to become a proprietary capital-source record?"* and *"Is this
> qualified capital source sufficiently aligned with this offering to justify entering the
> client's workflow?"*
>
> Every capability must serve one of these. A proposed feature that serves neither does not
> belong, and this section is what lets you say so without an argument.

## 3. Non-goals

*(Stage A3)* What this program does **not** do, and which system does it instead.

> Highest-value section in the document. Write it before the goals.

## 4. Success criteria for v1

*(Stage A4)* Observable, countable where possible.

## 5. Constraints

*(Stage A5)* Deadline · budget · legal and licensing · data available · operator ·
required integrations.

---

# Part II — Domain

## 6. Entities

*(Stage B1)* Every noun. One canonical name each, used everywhere afterwards including in
code.

| Entity | What it is | Identified by | What it is not |
|---|---|---|---|

## 7. Lifecycle

*(Stage B2)* For each major entity, the states and the transitions.

```
STATE ONE
    ↓
STATE TWO
    ↓
...
```

Exceptional exits: *held · suppressed · archived · expired · returned*

> This determines your schema, your workflows, your permissions and your phase
> boundaries. It also gives you free scope control — "v1 stops at STATE FOUR" is a precise
> and defensible statement.

## 8. Workflows

*(Stage B3)* Per workflow: trigger · steps · output · preconditions.

## 9. Vocabularies

*(Stage B4)* Every status, category, type and reason code, enumerated exhaustively.

**Statuses:**
**Categories:**
**Reason codes:**

> Reason codes are how the system explains its conclusions. Retrofitting them is painful —
> enumerate them now even if the list feels premature.

## 10. Data contracts

*(Stage B5)* Three to five JSON examples for the shapes that cross a boundary. Real field
names, realistic values, never `"string"`.

```json
{
  "example_id": "uuid",
  "...": "..."
}
```

---

# Part III — Rules

## 11. Invariants — always true

*(Stage C1)* Numbered. Each phrased as a testable claim.

## 12. Prohibitions — must never happen

*(Stage C2)* Numbered. Often more useful than Part 11.

> State explicitly that violating one is a **correctness bug, not a style preference**.
> This wording changes how Claude Code treats them.

## 13. Hard gates

*(Stage C3)* Numeric thresholds. Guessed numbers are fine — write them down so they can be
challenged, and mark them configuration rather than constants.

| Gate | Threshold | Applies to |
|---|---|---|

## 14. Human review

*(Stage C4)* Where a person decides, what they see, and what happens to their decision.

## 15. Failure and reversal

*(Stage C5)* What happens when a step fails. What can be undone, and how.

---

# Part IV — Technical

## 16. Stack

*(Stage E1)* Exact versions. Note where it follows an existing service's conventions.

## 17. Architecture

Services, boundaries, what owns what. What data may cross which boundary and by which
single sanctioned path.

## 18. Data model

Tables or collections, grouped. Which schema or database each belongs to.

## 19. Integrations

| System | Direction | Purpose | Terms or licensing |
|---|---|---|---|

## 20. Non-functional

Volume · growth · latency · availability · retention · audit · security · privacy.

> The IAM spec omitted this and it is the most common gap. Data volume in particular
> changes ingestion design, and finding that out during the first real load is expensive.

---

# Part V — Delivery

## 21. Development sequence

Phases in order, with what each delivers and what it depends on.

> Phase boundaries usually fall out of the lifecycle in Part 7. If they do not, the
> lifecycle is probably wrong.

## 22. Versions

| Version | Contains | Explicitly excludes |
|---|---|---|

## 23. Test properties

Statements that must hold, as properties rather than procedures.

> The IAM's are the model: *"title alone does not establish accreditation"*, *"public REIT
> exposure does not prove private real estate allocation"*, *"a departed employee is not
> selected"*. Each is a property, each maps to a real failure mode, each becomes a test
> almost verbatim.
>
> Write the negative cases. They are where the value is.

## 24. Open questions

What is not yet decided, and by when it must be.

---

## Before circulating

- [ ] Every noun in Part 6 used consistently throughout
- [ ] Every rule in Parts 11–12 testable as written
- [ ] Every threshold numeric
- [ ] Non-goals present and specific
- [ ] Lifecycle drawn with exceptional exits
- [ ] Contracts have realistic values
- [ ] Part 20 filled in, not skipped
- [ ] No Claude Code prompts inside this document — those are working artifacts with a
      different lifespan, and they live in `docs/prompts/`
