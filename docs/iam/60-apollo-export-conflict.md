# Commercial contact data: one question to confirm

Status: probably a non-issue. Raised 2026-08-01, narrowed after review. Needs a
one-line answer, not a legal project.

Provenance-gated export has been folded into `13-phase1d-governance-gateway.md`
(section 6, with tests and review checks). It is built regardless of how the question
below is answered.

---

## The likely correct reading

Apollo is a licensed commercial source rather than public data, so it belongs in the
source registry with its terms recorded — that much is just bookkeeping, and it is the
same category as the "approved commercial contact sources" named in Part V.

But the substantive concern originally raised here was overstated. Apollo's restriction
targets **reselling** — building a data product that resurfaces their records to your
own customers. Exporting contacts into your own CRM and sequencer to run outreach is
ordinary, expected use; Apollo builds integrations for precisely that. Capital Context
using Apollo data to run campaigns is the same thing any Apollo customer does.

## The one fact that decides it

Who operates the client campaign database, and who holds the Apollo licence?

**Case A — Capital Context operates the campaign infrastructure.** SuiteCRM, Mautic and
Smartlead are Capital Context's systems. Capital Context runs the outreach; the client
sees results, meetings and replies, not a contact export. This is internal use. Nothing
here needs attention beyond recording the source in the registry.

**Case B — each client takes delivery of contact records into their own systems.** The
client receives and independently uses contact data sourced from a Capital Context
licence. That is a handoff to a separate legal entity and is worth checking against the
actual contract.

Case A is the assumption these documents now proceed on.

## Why it was raised at all

Part I §3.10 of the Master Specification describes the client campaign database as
separate from the Universe, and lists "contact details" among the fields a client *may
receive*. That wording reads like Case B. If the reality is Case A, the specification
language is simply loose and no change is needed — but the two readings imply different
architectures, so it is worth being deliberate about which one is true.

## Cheap insurance, worth building either way

Provenance-gated export: every contact point carries its source, and the export
gateway's allow-list filters on provenance as well as field name.

This is worth implementing regardless of the Apollo answer, because:

- Phase 1b already propagates permitted-use classification from source to evidence item.
  Extending it to contact points is a small addition, not a new mechanism.
- Source terms change. A gateway that can answer "which sources contributed to this
  export payload" is defensible for any future source, and costs little now.
- It makes the `Onward Disclosure to Clients` column in the source registry actually
  enforceable rather than advisory.

This is now part of the Phase 1d prompt: section 6 requires the allow-list to filter on
source as well as field name, requires the gateway to report which sources contributed to
any payload, and requires that a record whose only contact path is withheld be dropped
from the export rather than exported with an empty contact. Seven tests and two review
checks cover it.

## Same question, other sources

The HNW submodule references "licensed wealth estimates" (Part III, agent 4) and the
Family Office submodule "licensed estimates" (Part IV, agent 4). Those are modelled
values, and the specification already prohibits exporting "detailed modelled wealth
estimates" — so they are likely fine. Confirm when those phases arrive.

## Caveat

A description of contractual shape, not legal advice. Terms referenced are Apollo's
published standard terms as of August 2026; your agreement governs.

## Sources

- [Apollo.io API Terms of Service](https://www.apollo.io/terms/api)
- [Apollo Terms of Service](https://getapollo.io/global/en/terms/)
