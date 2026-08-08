# Phase <N> — <Name>

**Prerequisite:** Phase <N-1> reviewed, tests passing, committed.
**Covers:** <components / agents / entities from the spec, by number>
**Goal:** one sentence. What exists at the end that did not exist before.

Target size: 1,000–1,400 words of prompt, five to eight components. Larger than that and
the output cannot be reviewed properly.

---

## Prompt

```
You are continuing <program>.

<One paragraph: what previous phases delivered, so the model has the running context.>

This is Phase <N>. Read CLAUDE.md and the prior phase documents before starting.

Scope: <one or two sentences>.

<ANY INVARIANT THIS PHASE MUST UPHOLD — stated before the work, in capitals if it is the
central one. If the phase has a single rule that must not be violated, lead with it and
demand the model explain how its design makes violation structurally impossible.>

BEFORE YOU START

<Anything to inspect rather than assume: existing work, real file formats, actual column
headers. "Report what you found before writing code."  This step catches the mismatch
between what the spec describes and what the data actually looks like.>

SCOPE OF THIS PHASE

1. <Component>
   - What it does
   - The hard rules, stated as rules
   - What it must never do

2. <Component>
   ...

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Name what belongs to later phases. Be specific — a vague exclusion gets ignored. Include
"do not build category-specific logic into shared foundations" where relevant.

TESTS

Provide unit and integration tests confirming that:
- <one line per invariant, phrased as the property to hold>
- <include the negative cases: what must NOT happen>
- <include boundary cases at exact thresholds, not just middles>

DELIVERABLES

migrations, models, contracts, services, endpoints, unit tests, integration tests,
documentation, and an updated docs/assumptions.md.

Before writing code, summarise <the specific design decision most worth checking early>
and wait for confirmation.
```

---

## Review checklist before accepting this phase

Written for the reviewer, not the model. Emphasise checks a test cannot make:

- [ ] <Something to verify by hand against real data>
- [ ] <Something to attempt and confirm fails — e.g. mutate an immutable record>
- [ ] <Something whose absence is itself a bug — e.g. an empty review queue after a large
      load means the rule is not firing>
- [ ] <Trace one code path yourself rather than trusting the test>
- [ ] No later-phase logic has leaked in
- [ ] `docs/assumptions.md` is non-trivial — an empty one means the model guessed silently

---

## Notes on writing these

**End with a checkpoint.** *"Summarise X and wait for confirmation"* is the cheapest
correction point in the whole build. Pick the thing most expensive to get wrong.

**State invariants before scope, not after.** A rule buried under a list of components
reads as one requirement among many.

**Demand structural impossibility, not compliance.** *"Explain how your design makes it
impossible for an agent to write a score"* produces a better result than *"agents must not
write scores."*

**Write the tests as properties, not procedures.** *"A departed employee is not selected"*
travels better than *"test the employment filter."*

**"Absent" is not "zero."** Wherever a value may be unknown, say explicitly that unknown
must stay distinguishable from zero and from negative. This is the single most common
silent modelling error.
