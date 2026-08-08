# CLAUDE.md — <Program name>

Place at the repository root. Binding on every Claude Code session in this repo.

---

## What this service is

One paragraph. What it does and what it is the system of record for.

Governed by `<spec document>`. Where this file and the specification appear to conflict,
stop and raise the conflict rather than choosing one.

**What it is not.** Name the neighbouring systems and what belongs to them. This is worth
more than it looks — most cross-boundary mistakes come from a reasonable-seeming
assumption about which system owns a concept.

---

## Stack

List it exactly. Then:

> Do not add frameworks, ORMs, queue systems, or storage engines beyond this list without
> asking first.

Where a sibling service already exists in the same stack, say so and say to follow its
conventions — that is free consistency and proven patterns.

---

## Boundary rules — hard constraints

Numbered, absolute, phrased so a violation is recognisable in a diff.

1. Which schemas or databases this service owns, and that it owns nothing else.
2. What it must never read or write directly.
3. Which migration tool owns what.
4. The single sanctioned path for data leaving this service.
5. *"If a task appears to require crossing any of these boundaries, stop and say so before
   writing code."*

---

## Non-negotiable domain invariants

The rules that are the reason the system exists. Violating one is a **correctness bug, not
a style preference** — say that explicitly.

Good invariants are testable and absolute. Examples from the IAM:

- LLM agents may classify evidence; they must never calculate a production score.
- Every material conclusion traces to an evidence item, and every evidence item to an
  approved source.
- Unknown data reduces coverage. It is never a positive match.
- Historical snapshots are immutable. Recalculation writes new; it never mutates old.
- Suppression always wins. No agent, override, or export path may bypass it.

If an invariant cannot be tested, it is a preference — move it to implementation style.

---

## Implementation style

Architecture, typing, logging, configuration, secrets, tests. Keep it short. The
guardrails above matter more.

State plainly: **a phase is not complete when the code exists; it is complete when its
tests pass.**

---

## Working agreement

- Keep diffs minimal and targeted. Do not opportunistically refactor adjacent code.
- No diagnostic or scratch code in runtime modules.
- When a request conflicts with any rule above, stop and call out the conflict before
  editing.
- **When an assumption has to be made because the spec is silent, record it in
  `docs/assumptions.md` rather than burying it in an implementation.** Maintaining that
  list is a standing deliverable.
- Do not build later-phase logic into earlier phases. Define the interface and leave it
  unimplemented.
