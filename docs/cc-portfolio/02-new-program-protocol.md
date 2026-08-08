# Protocol — putting a new program into development

Version 1, 2026-08-01. Derived from doing this once, for the IAM, and from the four
things that went wrong.

**Total: about 1.5 days from "spec exists" to "first prompt submitted."** Seven gates.
Each one prevents a specific, observed failure — none of them are ceremony.

---

## Why this exists

The IAM went from spec to submitted prompts in a day. It also produced four architecture
decisions, **three of which were wrong**, because they were made before anyone checked
what already existed. The Capital Raise Module already had `investor_targets.universe_person_id`
waiting for the Universe; the CRM was already Python/FastAPI, making the "separate stack"
reasoning moot; and the identity bridge was designed against the wrong codebase.

None of that was a judgment failure. It was a sequencing failure — decisions before
inventory. Gate 1 exists entirely to stop it happening again.

---

## The gates

### Gate 0 — Intake · 30 minutes

Answer before anything else:

- [ ] What does this program do, in one sentence?
- [ ] **Does it already exist, in whole or in part?** Name every module that touches the
      same domain
- [ ] What does it depend on, and what depends on it?
- [ ] Is it on the current critical path, or not?
- [ ] What is the first version worth shipping — the smallest useful thing?

**Fails if:** you cannot name the smallest useful version. That means the scope is not
understood yet, and everything downstream will be built to a moving target.

---

### Gate 1 — Inventory · 2 hours · **do not skip**

Before any decision is written down.

- [ ] Mount every codebase that could plausibly overlap. All of them, not the obvious one
- [ ] `git log --oneline | head -30` on each — commit messages tell you what was actually
      built faster than reading code
- [ ] List the data models: `grep -E "^class |__tablename__|^model "` 
- [ ] **Grep every codebase for the new spec's vocabulary.** If the spec says "capital
      source," grep for it. Fields named after your new concepts mean someone already
      started, or already designed the seam
- [ ] List existing integrations — `ls app/services/`, `ls app/integrations/`
- [ ] Write down what exists before deciding anything

**Fails if:** you write an architecture decision before completing this. That is the exact
failure this protocol was written to prevent.

**Worth knowing:** the IAM inventory took twenty minutes once the folder was mounted, and
would have prevented roughly six hours of rework.

---

### Gate 2 — Decisions · 2 hours

Every point where the spec is ambiguous is a point where Claude Code will guess silently
and expensively.

- [ ] Write one ADR per genuinely load-bearing decision. Aim for three to five, not twenty
- [ ] Each ADR: context · decision · rationale · consequences · **how cheaply it reverses,
      and until when**
- [ ] Mark each accepted, provisional, or open
- [ ] For any decision you are less than confident about, **write the case against it**
      before accepting. On IAM this changed the answer

Template: `templates/adr.md`

**Fails if:** an ADR has no "how cheaply does this reverse" line. Decisions without a
reversal cost get defended past their usefulness.

---

### Gate 3 — Decomposition · 4 hours

- [ ] Split the spec into prompts of a size you can actually review — roughly 1,000–1,400
      words of prompt, five to eight components each
- [ ] Sequence them so each is independently testable and committable
- [ ] Each prompt ends: *"summarise your intended approach and wait for confirmation"*
- [ ] Each prompt has an explicit **out of scope** section naming what belongs to later
      phases
- [ ] Each prompt has a review checklist for accepting it
- [ ] **Verify coverage programmatically** — script the check that every entity, component,
      event and deliverable in the source spec appears somewhere across the splits

Templates: `templates/phase-prompt.md`, `templates/verify-coverage.py`

**Fails if:** a single prompt asks for more than about eight components. The IAM spec's
Part II asked for twenty in one prompt; the output would have been unreviewable, and
unreviewed foundation code is the most expensive kind.

---

### Gate 4 — Guardrails · 1 hour

- [ ] `CLAUDE.md` at the new repo root: stack, boundary rules, domain invariants,
      implementation style, working agreement
- [ ] State the **non-negotiable invariants** explicitly — the things that are correctness
      bugs rather than style preferences
- [ ] Create `docs/assumptions.md`, empty, with the template header

Templates: `templates/CLAUDE.md`, `templates/assumptions.md`

**Fails if:** the invariants are not written down. Claude Code follows what it is told
and cannot infer what you would consider a violation.

---

### Gate 5 — Schedule · 1 hour

- [ ] Define versions: what does v0.1 contain, v0.5, v1.0? A version is a decision, not a
      feeling
- [ ] Add a row to `00-development-portfolio.md`
- [ ] Slot into `01-master-schedule.md` — and state explicitly whether it moves the
      critical path
- [ ] Estimate in **focused days**, then halve your assumed weekly availability

Template: `templates/register-row.md`

**Fails if:** you cannot say what the program does *not* include in v1.0. Scope defined
only by inclusion always grows.

---

### Gate 6 — Execute · per prompt

For each prompt, in order:

1. Submit
2. **Claude Code proposes its approach and stops.** Review it here — one message, and the
   cheapest correction point available
3. Build
4. Review against the prompt's checklist
5. Tests pass
6. Commit
7. Append anything learned to `docs/assumptions.md`

Never submit prompt N+1 before prompt N is committed.

**Fails if:** you skip the checkpoint at step 2 to save an hour. On this project that
trade reliably costs days later.

---

### Gate 7 — Close the loop · 30 minutes per phase

- [ ] Update the register row: state, next milestone
- [ ] Record new assumptions
- [ ] Note what the phase revealed that changes other modules
- [ ] **After the first real consumer of any foundation, pause and ask what the foundation
      got wrong.** Fixing it after one consumer is cheap; after four it is not

---

## The four failures this protocol prevents

| Failure | Observed | Gate |
|---|---|---|
| Decisions made before knowing what exists | Three of four IAM ADRs wrong | 1 |
| Prompts too large to review | Spec Part II — 20 components in one prompt | 3 |
| Assumptions buried in implementation | Would have hidden the adviser modelling choice | 4 |
| Wrong assumption discovered after the build | The `\gexec` SQL bug; the CRM's existing seam | 2, 6 |

---

## When to skip gates

Small additions to an existing program — one new agent, one new source, one new endpoint —
do not need this. Run Gate 1 (inventory), Gate 6 (checkpoint, review, commit), and append
to assumptions. Fifteen minutes.

The full protocol is for a new program or a new module: something that gets its own
repository, its own database, or its own row in the register.

---

## Where the artifacts live

```
<program-repo>/
  CLAUDE.md                    Gate 4
  docs/
    architecture-decisions.md  Gate 2
    assumptions.md             Gates 4, 6, 7
    spec-master.md             the source spec, converted
    runbook-<phase>.md         Gate 6
    prompts/                   Gate 3
  infra/                       database, deployment

cc-portfolio/
  00-development-portfolio.md  Gate 5 — the register
  01-master-schedule.md        Gate 5 — sequencing and critical path
  02-new-program-protocol.md   this file
  templates/                   the reusable pack
```
