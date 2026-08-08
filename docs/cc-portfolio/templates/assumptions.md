# Assumptions

A running list of every assumption made where the specification was silent, or where a
decision was taken outside it. Every phase appends. Nothing is buried in an
implementation.

Format: ID · date · assumption · why · what would change if wrong · who can overturn it.

An empty assumptions file after a build phase does not mean no assumptions were made. It
means they were made silently.

---

## A-001 · YYYY-MM-DD · One-line statement of the assumption

**Assumption.** What is being assumed, stated plainly enough that someone could disagree
with it.

**Why.** What made this necessary — the specification is silent, two readings are both
plausible, an external constraint forces it.

**If wrong.** What breaks, and how expensively. Be concrete: which tables, which phases,
which other modules.

**Condition.** *(optional)* Anything that must remain true for this assumption to hold.

**Overturned by.** Who can change it, and by when it becomes expensive.

---

## Template for later entries

```
## A-0NN · YYYY-MM-DD · One-line statement

**Assumption.**

**Why.**

**If wrong.**

**Overturned by.**
```

---

## Conventions

- **Number sequentially and never reuse.** A superseded assumption is amended in place
  with a dated note, not deleted — the history of what was believed and when is the point.
- **Append at every gate**, not at the end. Assumptions recorded in retrospect are
  reconstructions.
- **Downgrade rather than delete.** If confidence drops, add a dated paragraph saying so
  and mark it provisional. On the IAM, A-003 was downgraded the same day it was written
  once the opposing case was argued properly.
- **Claude Code appends here too.** The guardrails file instructs it to record any
  assumption it had to make rather than burying it in code.
