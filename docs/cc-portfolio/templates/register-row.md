# Register row + version definitions

Copy into `00-development-portfolio.md` and `01-master-schedule.md` at Gate 5.

---

## Register row — for `00-development-portfolio.md`

```markdown
### N. <Program name>

| Field | Value |
|---|---|
| **Purpose** | One sentence |
| **Spec** | Document name and where it lives, or "none" |
| **Code lives** | Absolute path or repo. "Nothing yet" is a valid answer |
| **Stack** | Exact |
| **State** | What is actually built, not what is planned |
| **Plan** | Where the phase prompts live |
| **Next milestone** | What and when |
| **Depends on** | Upstream modules, or "nothing" |
| **Feeds** | Downstream modules, and through which specific field or endpoint |
| **Open decisions** | With the phase by which each must be settled |
| **Owner** | |
```

**"Feeds" earns its keep when it names the actual seam.** "Feeds the Capital Raise Module"
is nearly useless; "writes `investor_targets.universe_person_id` via `POST /targets`" tells
you the integration already half exists. Finding that field is what shortened the IAM
export work from weeks to days.

---

## Version definitions — for `01-master-schedule.md`

```markdown
### <Program>

| Version | Contains | Target |
|---|---|---|
| **v0.1** | Smallest useful thing. Name what it does NOT include | date |
| **v0.5** | Enough for the first real use | date |
| **v1.0** | Feature complete against the spec | date |
```

Rules:

- **A version is a decision, not a feeling.** If you cannot say what is excluded, it is
  not defined.
- **v0.1 should be embarrassingly small.** For the IAM it is "records exist with an email
  address" — no scoring, no fit, no qualification. That still unblocked everything
  downstream.
- **Date only what is on the critical path.** Everything else gets a quarter. Precise
  dates on non-critical work create false pressure and hide the real constraint.

---

## Critical path statement

Every new program needs an explicit answer to: **does this move the critical path?**

```markdown
| Required for <the fixed date> | Status | Note |
|---|---|---|
| <thing> | <module, version, date> | |
```

Then state what is deliberately *off* the path, with the days deferred. On the IAM that
was roughly 50–80 focused days — the evidence ledger, scoring, agent framework, RIA depth,
fit engine and learning loop, all moved to Q1 without touching the November date.

Naming the deferred work is as important as naming the critical path. It is what stops it
quietly creeping back in.
