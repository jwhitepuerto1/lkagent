# Starting a new development program with Claude

The whole process. Any program, from nothing.

**You spend about 2 hours. Claude does the rest. Claude Code starts building the same day.**

---

## Step 1 — Bring five answers (10 minutes of thinking)

Before opening a chat, have rough answers to these. Rough is fine — they get refined in
Step 2.

1. **What does it do?** One paragraph.
2. **Who uses it, and to do what?**
3. **What does it explicitly NOT do?**
4. **What's the smallest version worth having?**
5. **Any hard constraints?** Deadline, budget, legal, systems it must work with.

If you can't answer 3 or 4, that's the real work — and it's what Step 2 is for.

---

## Step 2 — Kickoff conversation with Claude (~1 hour)

Open a new chat. Paste this:

```
I want to start a new development program. Nothing exists yet — no spec, no code.

Here's what I have:

WHAT IT DOES: <your paragraph>
WHO USES IT: <who, and to do what>
WHAT IT DOESN'T DO: <boundaries>
SMALLEST USEFUL VERSION: <what v1 is>
CONSTRAINTS: <deadline, budget, legal, systems>

Interview me. Ask what you need to write a specification a developer could build
from. Push back where my answers are vague or where I've assumed something you
can't verify. Don't write anything until you've finished asking.
```

Then answer the questions. Conversationally — you don't need to be precise or organised;
that's Claude's job to impose afterwards.

**Expect roughly 12 questions**, covering: the decisions the system makes, the things it
knows about, the states those things move through, what triggers what, what must always be
true, what must never happen, where data comes from and goes, where a human has to decide,
and how you'll know v1 worked.

**The point of the interview is the pushback.** If a question feels annoying or you find
yourself saying "I hadn't thought about that," that's the process working. Those are the
gaps that would otherwise surface in week six as rework.

---

## Step 3 — Claude writes the spec (same session, ~30 min)

You get a draft specification back. Read it and look for three things:

- **Something wrong.** Say so. Domain knowledge is yours, not Claude's.
- **Something missing.** Usually an edge case you know about and never mentioned.
- **Something you don't recognise.** That's a guess. Make Claude flag it as an assumption
  or remove it.

Two or three rounds of this. Don't aim for perfect — aim for "nothing in here is wrong."

---

## Step 4 — Claude builds the development kit (~1 hour, mostly Claude)

From the spec, Claude produces:

| Artifact | What it does |
|---|---|
| The repo, scaffolded | Where the code goes |
| `CLAUDE.md` | Rules Claude Code must follow — stack, boundaries, things that must never happen |
| `docs/spec-master.md` | The spec, in the repo where Claude Code can read it |
| `docs/decisions.md` | The 3–5 architecture choices, each with how cheaply it reverses |
| `docs/assumptions.md` | Running list of anything guessed, so it's visible not buried |
| `docs/prompts/` | The build, split into 4–8 sequenced prompts you can actually review |
| `docs/runbook.md` | What you do, in order, day by day |

You review two things: the architecture decisions, and the prompt sequence. Everything
else is mechanical.

---

## Step 5 — Start Claude Code

Open Claude Code in the new repo. Paste prompt 1.

Then, for every prompt:

1. **Claude Code states its approach and stops.** Read it. This is the cheapest place to
   catch a wrong assumption — one message, versus days of rework.
2. It builds.
3. You review against the prompt's checklist.
4. Tests pass.
5. Commit.
6. Next prompt.

**Never submit prompt N+1 before prompt N is committed.**

---

## The five rules that make this work

**1. Non-goals before goals.** What it doesn't do is worth more than what it does. Without
that boundary written down, scope grows every week and nothing finishes.

**2. Nouns before verbs.** Settle what the system knows about, and what states those things
move through, before describing features. Get this wrong and you rebuild the foundation.

**3. Rules, not just features.** "What must never happen" is more valuable than any feature
list. Each one becomes a test and explains a design decision.

**4. Small prompts.** 4–8 components each. A prompt asking for twenty produces output too
large to review, and unreviewed foundation code is the most expensive kind.

**5. Write down every guess.** Assumptions recorded in a file get challenged. Assumptions
buried in code get discovered in production.

---

## Time

| Step | You | Claude |
|---|---|---|
| 1 — Five answers | 10 min | — |
| 2 — Interview | 1 hr | 1 hr |
| 3 — Spec review | 30 min | 30 min |
| 4 — Build the kit | 15 min review | 1 hr |
| 5 — First prompt | ongoing | — |

**About 2 hours of your time before Claude Code starts building.**

---

## If it's bigger than that

Some programs need more. The signal is Step 2 running past 90 minutes, or the spec draft
coming back with more than about ten open questions. Then it's worth splitting the
interview across two sessions — domain first, rules second — and letting the spec settle
overnight.

That's still under a day of your time.

---

## Reference

- `02-new-program-protocol.md` — longer form, for when a spec already exists or the program
  sits beside existing systems
- `03-greenfield-program-protocol.md` — the full-detail version of this document
- `templates/` — the artifacts Claude produces in Step 4, if you want to see the shapes

You don't need to read any of those to run this. They're for when something goes wrong and
you want to know what step was skipped.
