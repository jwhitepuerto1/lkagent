# Phase 1a — Persistence Foundation

**Submit to:** Claude Code, in the `ias-iam` repository, with `CLAUDE.md` already in place.
**Prerequisite:** Phase 0 checklist complete (see `30-phase0-checklist.md`).
**Covers shared components:** 18 (Audit Logging), 19 (RBAC), 20 (Monitoring and Error
Reporting), plus all 34 core entities.
**Goal of this phase:** a database you can trust, and nothing that depends on one.

---

## Prompt

```
You are a senior software architect and Python/PostgreSQL engineer.

You are building the persistence foundation for the Capital Context IAS Investor
Acquisition Module (IAS IAM), a capital-source intelligence service for private
commercial real estate capital raises.

This is Phase 1a of a phased build. Its scope is deliberately narrow: the database,
the models, the contracts, the repository layer, and the cross-cutting concerns that
everything else will sit on. Do NOT implement ingestion, evidence extraction, scoring,
agents, workflows, or the export gateway in this phase. Later phases add those. Where
they will attach, define the interface and leave it unimplemented.

Read CLAUDE.md before starting. Its boundary rules and domain invariants are binding.

SCOPE OF THIS PHASE

1. Project scaffolding
   - Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic.
   - Clean architecture with dependency injection: api -> services -> repositories.
   - Environment-based configuration. No secrets in source, fixtures, or seed data.
   - Structured JSON logging.
   - Docker and docker-compose for local development, including PostgreSQL 16.
   - Follow this project structure:

     ias_iam/
     |- app/
     |  |- api/
     |  |- core/            (config, security, logging, exceptions)
     |  |- database/        (models, repositories, migrations, views)
     |  |- contracts/       (evidence, capital_source, agent, offering, fit, campaign)
     |  |- shared/          (interface stubs for later phases)
     |  |- modules/         (empty package placeholders: hnw, family_office, ria, offer_fit)
     |  |- integrations/    (empty package placeholders)
     |  |- tests/
     |- docs/

2. Database schemas
   Create exactly four: ias_core, ias_score, ias_ops, ias_gateway.
   Assign every table below to one of them and document the rationale.
   Alembic must never generate a migration touching the `public` schema.

3. SQLAlchemy models and Alembic migrations for all 34 entities:

   source_registry, ingestion_batch, raw_record, person, person_identifier,
   contact_point, organization, employment, person_organization_relationship,
   evidence_item, evidence_claim, signal, capital_source, category_assessment,
   professional_credential, verification_attestation, sponsor, offering,
   offering_profile_version, feature_definition, person_feature_value,
   organization_feature_value, model_registry, offering_fit_assessment,
   priority_assessment, agent_run, workflow_job, review_queue, suppression,
   audit_event, outcome_event, client_export, capital_source_assignment

   Requirements:
   - UUID primary keys.
   - Created/updated timestamps, timezone-aware, on every table.
   - Foreign keys and indexes reasoned about explicitly, not added reflexively.
   - Every table that participates in qualification must carry the provenance fields
     the specification requires, including: last source checked, last record changed,
     last agent assessment, last score calculated, last human review.
   - Score snapshot tables must be append-only by design. Document how that is enforced.
   - Where the specification names a status vocabulary, model it as a database enum or
     a constrained lookup table, not a free-text column.

4. Pydantic contracts
   Implement the four contracts given in the specification exactly as specified, as the
   canonical shapes:
   - evidence item
   - qualified capital-source record
   - offering profile
   - offering-fit assessment
   Derive the remaining contracts from the entity list. Version the contracts explicitly;
   every agent and API payload will carry a contract version.

5. Repository layer
   One repository per aggregate. Repositories own all SQLAlchemy usage. No query logic
   above this layer. Provide async interfaces.

6. Audit logging (shared component 18)
   An append-only audit_event trail capturing actor, action, subject, before/after where
   applicable, and timestamp. Every state transition in later phases will write to it,
   so the write path must be simple and hard to bypass.

7. Role-based access control (shared component 19)
   Define the role and permission matrix. At minimum, distinguish: system/service,
   internal analyst, internal reviewer, internal administrator, and client-facing export
   consumer. The last of these must be structurally incapable of reading Universe
   internals. Implement enforcement primitives; the endpoints that use them come later.

8. Monitoring and error reporting (shared component 20)
   Health endpoints, structured error taxonomy, and a consistent exception hierarchy in
   app/core/exceptions. No silent failures.

9. Extension points
   Define, but do NOT implement, the Protocol interfaces the later phases will satisfy:

   class CapitalSourceModule(Protocol):
       def ingest_candidate(self, payload: dict) -> str: ...
       def resolve_identity(self, candidate_id: str) -> dict: ...
       def extract_evidence(self, capital_source_id: str) -> list[dict]: ...
       def calculate_qualification(self, capital_source_id: str) -> dict: ...
       def audit_qualification(self, capital_source_id: str) -> dict: ...
       def publish_qualified_record(self, capital_source_id: str) -> dict: ...
       def recalculate_after_event(self, capital_source_id: str, event: dict) -> dict: ...

   class OfferingFitService(Protocol):
       def calculate_fit(self, capital_source_id: str, offering_version_id: str) -> dict: ...
       def identify_hard_restrictions(self, capital_source_id: str, offering_version_id: str) -> list[dict]: ...
       def recommend_action(self, qualification: dict, fit: dict, assignment: dict) -> str: ...

EXPLICITLY OUT OF SCOPE FOR THIS PHASE

Do not implement: source governance enforcement, ingestion, identity resolution,
the evidence ledger service, feature calculation, scoring, agents, workflow execution,
the review queue behaviour, suppression enforcement, behavioural event processing,
the export gateway, or assignment/conflict logic. Their tables exist after this phase;
their behaviour does not.

Do not implement any HNW, Family Office, RIA, or Offering Fit category logic.

TESTS

Provide unit and integration tests covering:
- every migration applies cleanly to an empty database and rolls back
- no migration references the `public` schema
- the four schemas exist with the expected tables
- a database role restricted per CLAUDE.md cannot read ias_* tables
- append-only tables reject updates and deletes
- audit_event is written for a representative state transition
- the RBAC matrix denies a client-export role access to Universe internals
- every Pydantic contract round-trips its example payload from the specification

DELIVERABLES

1. Technical architecture document for the persistence layer, including the
   schema-assignment rationale.
2. Alembic migrations.
3. SQLAlchemy models.
4. Pydantic contracts.
5. Repository layer.
6. Role and permission matrix.
7. Unit tests and integration tests.
8. Seed data for test environments, containing no real personal data and no secrets.
9. Local development configuration and Docker setup.
10. docs/assumptions.md, listing every assumption made where the specification was
    silent.

Before writing code, summarise your intended schema assignment (which of the 34 tables
goes in which of the 4 schemas) and your indexing strategy, and wait for confirmation.
```

---

## Review checklist before accepting this phase

- [ ] All 34 entities present, none invented, none silently renamed
- [ ] Schema assignment is defensible and documented
- [ ] No migration touches `public`
- [ ] Grant restriction is verified by a test, not asserted in prose
- [ ] Score snapshot immutability is enforced by the database, not by convention
- [ ] The four specification contracts match the document byte-for-byte in field names
- [ ] `docs/assumptions.md` exists and is non-trivial — an empty one means the model
      guessed silently
- [ ] No category-specific (HNW/FO/RIA) logic has leaked in
- [ ] Tests pass from a clean checkout with `docker-compose up`
