# Prisma Bridge — deferred to Phase 6

**Status: prepared, NOT applied.** Do not apply this until Phase 6 (behavioural and
outcome learning), when campaign events first flow between `ias-iam` and `ias-v1`.

## Why it is deferred

Per ADR-003, the link between the two services reuses the existing `ExternalIdentity`
model rather than introducing a second mapping table. The change itself is two enum
values.

It is not applied now because:

1. Nothing consumes it until Phase 6. Applying it early leaves `schema.prisma` ahead of
   the deployed database for months.
2. This repository has no `prisma/migrations/` directory, which suggests the database is
   currently managed with `prisma db push`. Editing the schema without a matching push
   produces drift between the checked-in schema and the running database — the exact
   failure mode that is hardest to diagnose later.
3. `AGENTS.md` asks for minimal, targeted diffs. A schema change with no consumer is
   neither.

## The change

In `prisma/schema.prisma`, add one value to each of two existing enums:

```prisma
enum ExternalSystem {
  GLOBALDB
  SMARTLEAD
  AIMFOX
  MAUTIC
  SUITECRM
  IAM          // <-- add: the ias-iam Universe service
  OTHER
}

enum ExternalObjectType {
  CONTACT
  LEAD
  ACCOUNT
  CAMPAIGN_MEMBER
  CAPITAL_SOURCE   // <-- add: a qualified CC Universe capital source
  OTHER
}
```

No new model, no new field, no change to `Party`, `Lead`, or any relation.

## Why this is sufficient

`ExternalIdentity` already carries the constraints the bridge needs:

```prisma
@@unique([system, externalId])            // one IAM capital source maps to one Party
@@unique([system, partyId, objectType])   // one Party has one IAM capital-source link
@@index([partyId])
```

A row with `system = IAM`, `objectType = CAPITAL_SOURCE`, and
`externalId = <capital_source_id>` links a portal `Party` to its Universe record. The
uniqueness constraints prevent the identity fragmentation this model was built to avoid.

## Applying it, when the time comes

1. Confirm how the database is currently migrated (`db push` vs. migrations). If it is
   `db push`, consider adopting real migrations before Phase 6 — by then there will be
   production data worth protecting.
2. Add the two enum values.
3. Generate and apply the migration.
4. Regenerate the Prisma client (`generated/prisma/` is checked in, so the regenerated
   output must be committed too).
5. Verify existing `ExternalIdentity` rows are unaffected — adding an enum value is
   additive and should not touch them, but confirm rather than assume.

## Direction of writes

`ias-iam` never writes to `public`. Per ADR-002 it has no grants there. The
`ExternalIdentity` row is written by `ias-v1`, in response to an export or a linkage
event received from the gateway. Keep that direction one-way.
