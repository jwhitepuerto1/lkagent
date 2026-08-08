# Capital Context — portfolio and development process

> **Placement note.** Written into `ias-v1/docs/` because that was the only writable
> location available. This sits *above* any single module and should move to its own home.
> `ias-v1` is Capital Context Access — one of the modules described here, not the parent.

---

## Starting a new program

**`START-HERE-new-program.md`** — the whole process on one page. ~2 hours of your time
from idea to Claude Code building. Everything else here is reference.

---

## Documents

| File | Purpose |
|---|---|
| `START-HERE-new-program.md` | **New program, nothing exists. Start here.** Five answers → interview → spec → kit → build |
| `00-development-portfolio.md` | The register. Every module: state, code location, dependencies, open decisions |
| `01-master-schedule.md` | Active projects, version definitions, schedule to Nov 1, critical path, risks |
| `02-new-program-protocol.md` | A program that **already has a spec**, or a new module beside existing ones. Seven gates, ~1.5 days spec → first prompt |
| `03-greenfield-program-protocol.md` | **A brand new program with no spec and no code.** Seven stages A–G, 3–5 days idea → first prompt. Produces the spec |
| `templates/` | The reusable pack the protocol references |

## Templates

| File | Gate |
|---|---|
| `templates/spec-skeleton.md` | Greenfield D — the specification structure |
| `templates/adr.md` | 2 / E — architecture decisions, with reversal cost |
| `templates/phase-prompt.md` | 3 — how to write a reviewable phase prompt |
| `templates/verify-coverage.py` | 3 — proves the split dropped nothing |
| `templates/CLAUDE.md` | 4 — guardrails for a new repo |
| `templates/assumptions.md` | 4 — the running assumption log |
| `templates/register-row.md` | 5 — register entry and version definitions |

## Start here

- **Brand new program, nothing exists?** `03-greenfield-program-protocol.md`, Stage A.
- **Spec already written, or a module beside an existing system?** `02-new-program-protocol.md`, Gate 0.
- **Where does everything stand?** `00-development-portfolio.md`.
- **What happens when?** `01-master-schedule.md`.

## The one rule worth remembering

**Inventory before decisions.**

The IAM produced four architecture decisions in a day, three of which were wrong, because
they were made before anyone checked what already existed. The Capital Raise Module was
already Python/FastAPI — which dissolved the stack argument — and already had
`investor_targets.universe_person_id` sitting there waiting for the Universe.

Twenty minutes of inventory would have prevented about six hours of rework. Gate 1 exists
for that reason alone.

## Which protocol

```
Do you have a written specification?
├── No  → 03-greenfield-program-protocol.md   (A-G, 3-5 days, produces the spec)
└── Yes → 02-new-program-protocol.md          (0-7, ~1.5 days, produces the prompts)

Small addition to something that already exists?
└── Neither. Inventory, checkpoint, review, commit, append to assumptions. 15 minutes.
```

Greenfield runs A–E and then hands to `02`'s Gates 3–7, which are the same work. The two
documents overlap deliberately at decomposition — that half is mechanical either way.
