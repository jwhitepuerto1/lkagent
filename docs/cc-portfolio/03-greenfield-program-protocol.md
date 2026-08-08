# Protocol — a brand new program, from idea to first prompt

Version 1, 2026-08-01. For a program with **no existing spec and no existing code**.

`02-new-program-protocol.md` starts where a spec already exists. This one produces the
spec. It is the harder half and it is where things go wrong.

**Total: 3–5 days for a substantial program.** Seven stages, A through G.

---

## Why disorganisation happens here

Not from lack of effort. From doing the stages in the wrong order. The five specific
failures:

| Failure | What it looks like later |
|---|---|
| Writing features before settling the nouns | Three names for the same concept across the codebase |
| No explicit non-goals | Scope grows every week and nothing is ever finished |
| Rules discovered during the build | Foundation gets rebuilt when a rule turns out to be structural |
| No lifecycle | Statuses invented ad hoc, `status` becomes free text |
| Decisions made in conversation | Nobody can reconstruct why, so they get re-argued |

Stages A–C exist to close all five before a line of the spec is written.

**The rule: nouns before verbs, rules before features, non-goals before goals.**

---

# Stage A — Definition · half a day

No structure, no schema, no technology. Just what and why.

### A1. The problem, in one paragraph

What breaks today, for whom, and what it costs. Written so someone outside the business
would understand it. If it takes more than a paragraph the program is probably two
programs.

### A2. The questions the system must answer

Two or three, no more. Not features — questions.

The IAM spec does this well and it is the single best thing in it:

> *Is this person or organization sufficiently identified, supported by evidence, relevant
> to private alternatives and private real estate, accessible, and qualified to become a
> proprietary Capital Context capital-source record?*
>
> *Is this qualified capital source sufficiently aligned with this specific sponsor and
> offering to justify entering the client's investor acquisition workflow?*

Everything the system does exists to answer one of those. When a feature is proposed later
and maps to neither, it does not belong.

### A3. Non-goals — write these before the goals

What this program explicitly does **not** do, and which system does it instead. Five to
ten lines.

This is the highest-value paragraph in the whole document and the one most often skipped.
Without it, every conversation for six months relitigates the boundary.

### A4. Success criteria for v1

How you will know it worked. Observable, ideally countable. "Better investor targeting" is
not a criterion; "we can produce 200 qualified, reachable RIA prospects for a named
offering" is.

### A5. Constraints

Deadline · budget · legal and licensing · data available · who operates it · what it must
integrate with. Constraints discovered later are the ones that cause rework.

**Stage A gate:** you can state the problem, the two questions, the non-goals and the v1
criteria on one page. If not, stop here — no amount of specification will fix an unclear
purpose.

---

# Stage B — Domain · 1 day

The nouns and their behaviour. Still no technology.

### B1. Entity list — the nouns

Every thing the system knows about. Name each one **once** and use that name everywhere
afterwards, including in code. Vocabulary drift is the most common and most annoying
source of confusion in a young codebase.

For each: what it is, what identifies it, and what it is not.

### B2. Lifecycle — the states

For each major entity, the states it moves through, as a linear diagram with the
exceptional exits named. From the IAM:

```
RAW SOURCE RECORD → INGESTED → IDENTITY RESOLVED → RESEARCH CANDIDATE
  → CATEGORY ASSESSED → CONDITIONALLY QUALIFIED → QUALIFIED
  → OFFERING MATCHED → CAMPAIGN ELIGIBLE → ENGAGED → ...

may also become: held · suppressed · disqualified · archived · expired
```

**Do this before anything else structural.** The lifecycle determines the schema, the
workflows, the permissions and the phase boundaries. A system without an explicit
lifecycle grows one by accident, badly.

It also gives you free scope control: "v1 stops at RESEARCH CANDIDATE" is a precise,
defensible scope statement.

### B3. Workflows — the verbs

What triggers what. For each: the trigger, the steps, what it produces, and what must be
true for it to run.

### B4. Vocabularies

Every status, category, reason code and enum, listed exhaustively. If a field can hold one
of a fixed set of values, enumerate them here — not in code later.

Reason codes deserve particular attention: they are how the system explains itself, and
retrofitting them is painful.

### B5. Data contracts

Three to five example JSON payloads for the shapes that cross boundaries. Real field
names, realistic values.

These are worth more per line than any prose in the document. They remove ambiguity that
paragraphs cannot.

**Stage B gate:** someone else could draw your schema from this without asking you a
question.

---

# Stage C — Rules · half a day

The invariants. This is what separates a specification from a feature list, and it is
what most drafts lack.

### C1. What must always be true

Absolute properties. Phrase them as testable claims.

### C2. What must never happen

Often more useful than C1. The IAM's are exemplary:

- LLM agents may classify evidence; they must never calculate a production score
- Modelled probability is never represented as legal verification
- Unknown data never counts as a positive match
- Suppression is never bypassed
- Historical snapshots are never mutated

Each is testable, absolute, and explains a design decision downstream.

### C3. Hard gates, with numbers

Where the system decides yes or no, state the thresholds numerically. `identity confidence
>= 0.95`. Guessed numbers are fine and expected — write them down so they can be
challenged, and mark them as configuration rather than constants.

### C4. Human-in-the-loop points

Where a person must decide, and what they see when they do. Every automated system has
these; the ones that pretend otherwise have them anyway, undesigned.

### C5. Failure and reversal

What happens when a step fails, and what can be undone. Reversibility designed in is
cheap; retrofitted it is not.

**Stage C gate:** every rule in C1 and C2 could be written as a test.

---

# Stage D — Spec assembly · half a day

Now write the document, using `templates/spec-skeleton.md`. Stages A–C are the content;
this is assembly and self-review.

**Self-review checklist:**

- [ ] Every noun in B1 appears with one consistent name throughout
- [ ] Every rule in C1/C2 is testable as written
- [ ] Every numeric threshold is stated, not implied
- [ ] Non-goals are present and specific
- [ ] The lifecycle is drawn, with exceptional exits
- [ ] Data contracts have realistic values, not `"string"`
- [ ] A reader could build the wrong thing — where? Fix those places
- [ ] Nothing about implementation technology yet

**Do not write the Claude Code prompts inside the spec.** The IAM spec did, and the
prompts had to be extracted and rewritten anyway. Keep the spec about *what*; prompts come
at Stage F and are working artifacts with a different lifespan.

---

# Stage E — Technical decisions · half a day

Only now does technology enter.

### E1. Stack

Choose it, and prefer what already exists in the portfolio. Consistency is worth more than
optimality for the second and third system.

### E2. ADRs

Three to five, using `templates/adr.md`. Every ADR needs a reversal cost. For any you are
less than confident about, write the case against it first.

### E3. Repository and guardrails

- Create the repo
- `CLAUDE.md` from `templates/CLAUDE.md` — stack, boundaries, invariants from Stage C
- `docs/assumptions.md` from the template, empty
- Convert the spec to Markdown into `docs/spec-master.md`
- `.gitignore`, `infra/` if it needs a database
- Commit

### E4. Infrastructure

Database, deployment target, credentials by environment. If it needs a database, write and
**test** the setup SQL now — verifying the boundary before any code exists is much cheaper
than after.

---

# Stage F — Decomposition · 1 day

As `02-new-program-protocol.md` Gate 3.

- Split into phase prompts of 1,000–1,400 words, five to eight components each
- Sequence so each is independently testable and committable
- Every prompt: out-of-scope section, checkpoint, review checklist
- Run `templates/verify-coverage.py` — prove nothing was dropped
- Write the runbook for the first two phases

**Phase boundaries usually fall out of the lifecycle from B2.** If they do not, the
lifecycle is probably wrong.

---

# Stage G — Launch

- Add the register row and version definitions — `templates/register-row.md`
- Slot into `01-master-schedule.md`; state whether it moves the critical path
- Submit prompt 1
- **Review the checkpoint before letting it write code**

---

## Time and sequence

| Stage | Output | Time |
|---|---|---|
| A — Definition | One page: problem, questions, non-goals, criteria, constraints | 0.5 d |
| B — Domain | Entities, lifecycle, workflows, vocabularies, contracts | 1 d |
| C — Rules | Invariants, prohibitions, gates, human points, reversal | 0.5 d |
| D — Spec assembly | The specification document | 0.5 d |
| E — Decisions | Stack, ADRs, repo, guardrails, infrastructure | 0.5 d |
| F — Decomposition | Phase prompts, coverage verified, runbook | 1 d |
| G — Launch | Register, schedule, prompt 1 submitted | 0.5 d |

**3–5 days.** Against a build measured in months, and against the cost of discovering in
week six that the lifecycle was wrong.

---

## What I can do for you at each stage

| Stage | Mine | Yours |
|---|---|---|
| A | Ask the questions that expose a soft answer | The answers — this is domain knowledge |
| B | Draft entities, lifecycle and contracts from your description; challenge them | Correct them. You know the business |
| C | Draft invariants; write the case against the ones I doubt | Confirm the numbers |
| D | Assemble and self-review the document | Read it and disagree |
| E | ADRs, repo scaffold, guardrails, infra SQL | The decisions themselves |
| F | Split, verify coverage, write the runbook | Review the split |
| G | Register and schedule entries | Submit and review |

**The efficient pattern: you talk through Stages A–C, I write them up and push back where
an answer is soft, and I take D–F almost entirely.** The IAM took a day from finished spec
to submitted prompts, and that half is now largely mechanical.

The half that cannot be delegated is A–C. Those are decisions about your business, and
guessing them is exactly how a program ends up disorganised.
