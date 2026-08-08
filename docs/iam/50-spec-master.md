<!-- Converted from 'IAS Investor Acquisition Module.docx'. Structural conversion only:
     no wording changed, nothing added or removed. The .docx remains authoritative. -->

# IAS Investor Acquisition Module
**Master Functional and Development Specification**
Module name: IAS Investor Acquisition Module
Abbreviation: IAS IAM
System owner: Capital Context
Primary proprietary asset: Capital Context Universe Database
Primary purpose: Build, maintain, qualify, and apply a proprietary universe of prospective capital sources to Capital Context client CRE offerings.


## Part I — IAS IAM Purpose and Functions

### 1. System Purpose
The IAS Investor Acquisition Module is the capital-source intelligence component of the broader Capital Context Investor Acquisition System.
Its purpose is to:
Build the Capital Context Universe Database from approved external data sources.
Continuously update and enrich the Universe Database.
Process each capital-source category through specialized qualification agents.
Convert raw external records into evidence-supported, qualified Universe records.
Collect permitted behavioral and outcome data from active IAS client campaigns.
Use campaign results to improve future qualification and fit scoring.
Build a structured intelligence profile for every IAS client, sponsor, and offering.
Match qualified capital sources to each client offering.
Route only sufficiently qualified, offering-aligned capital sources into the applicable client campaign database.
Protect the proprietary CC Universe from direct client access, extraction, or ownership.
The IAS IAM should not function as a static contact database.
It should function as a continuously learning capital-source intelligence and investor-offering matching system.


### 2. Four Primary IAS IAM Submodules
The IAM consists of four primary submodules:
Submodule 1: HNW Investor Intelligence
Builds and maintains the universe of probable or verified accredited HNW and UHNW natural persons.
Primary questions:
Is the person correctly identified?
Is there credible evidence that the person may qualify as an accredited investor?
Is there evidence of private or alternative investment participation?
Is there evidence of private real estate interest?
What check size, strategy, geography, risk, income, liquidity, and vehicle characteristics may fit?
Is the person reachable and appropriate for further qualification?
Submodule 2: Family Office Intelligence
Builds and maintains the universe of genuine or probable family offices and their investment decision-makers.
Primary questions:
Is the organization a genuine single-family office, multi-family office, or family investment organization?
Does it have credible capital capability?
Does it invest in private alternatives?
Does it allocate to private real estate?
What property types, structures, geographies, and strategies are relevant?
Who controls, recommends, or influences investment decisions?
Is the family office accessible to third-party CRE sponsors?
Submodule 3: RIA Allocator Intelligence
Builds and maintains the universe of RIA firms and advisers that allocate client capital to privately offered alternative investments and show evidence of private real estate interest.
Primary questions:
Is the RIA active and correctly identified?
Does it serve a relevant HNW, UHNW, family, trust, or qualified-client base?
Does it recommend or allocate client capital to non-public alternative investments?
Does it have evidence of private real estate allocation or interest?
Can it consider third-party CRE sponsors?
Who are the relevant advisers, investment professionals, committee members, or gatekeepers?
Which adviser is most relevant to a specific offering?
Submodule 4: Client and Offer Intelligence and Fit Engine
Builds structured profiles of IAS clients, sponsors, and offerings and matches them against the CC Universe.
Primary questions:
What are the complete characteristics of the sponsor and offering?
What capital-source profiles are appropriate?
Which HNW investors, family offices, and RIA advisers fit the offering?
Which capital sources should be excluded?
Which capital sources should receive immediate outreach, nurture, further research, or no contact?
How should overlapping fit among no more than five active raises be managed?


### 3. Shared IAS IAM Functions
The following functions are shared across all four submodules.

#### 3.1 Source governance
The system must maintain a registry of approved sources containing:
Source name.
Source type.
Permitted fields.
Permitted uses.
Prohibited uses.
Licensing restrictions.
Retention requirements.
Refresh schedule.
Reliability rating.
Terms-review date.
No source may enter production ingestion until approved.

#### 3.2 Data ingestion
The system must:
Import structured and unstructured source records.
Preserve raw source references.
Generate content hashes.
identify changed records.
prevent duplicate ingestion.
record collection dates.
trigger only the workflows affected by a material change.

#### 3.3 Identity and entity resolution
The system must resolve:
Natural persons.
RIA firms.
Family offices.
Related entities.
Employers.
Investment companies.
Trusts.
Funds.
Real estate entities.
Sponsor organizations.
Records must not be merged solely because they have similar names.

#### 3.4 Evidence ledger
Every material fact used for qualification or scoring must be stored as evidence.
Each evidence item must include:
Source.
Subject.
Claim.
Observed value.
Collection date.
Observation date.
Reliability.
Directness.
Extraction confidence.
Expiration date.
Supporting source reference.
Contradictions.
Permitted-use classification.

#### 3.5 Deterministic scoring
Agents may identify and classify evidence.
Agents must not independently determine final production scores.
Final scores must be calculated by deterministic, version-controlled services.
This applies to:
Accreditation probability.
Family-office authenticity.
RIA allocator qualification.
Alternative-investment propensity.
Private real estate affinity.
Capital capability.
Decision-maker relevance.
Offering fit.
Operational priority.

#### 3.6 Evidence audit
A separate audit agent must challenge high qualification and fit results.
The audit process must check for:
Mistaken identity.
Duplicate evidence.
Stale data.
Unsupported assumptions.
Vendor estimates represented as facts.
Public real estate confused with private real estate.
Fund management confused with allocation activity.
Employee title confused with authority.
Gross property value confused with equity.
Proprietary products confused with third-party accessibility.
Conflicting source information.

#### 3.7 Human review
Human review must be available for:
Identity conflicts.
Material contradictions.
High-value but incomplete records.
First entry into a high-priority qualification band.
Records relying heavily on modeled financial estimates.
Uncertain family-office classification.
Uncertain RIA third-party accessibility.
Offering-document conflicts.
Campaign conflicts among active raises.

#### 3.8 Daily updates
The IAM should check for new information daily.
Daily processing may include:
New or amended regulatory records.
Employment changes.
New family-office investment activity.
Business sales and liquidity events.
New CRE transactions.
Changes to firm websites.
New investment mandates.
Updated contact validation.
New IAS campaign behavior.
Due diligence activity.
Verification status.
Subscription activity.
Funding outcomes.
Not every source changes daily. The system must separately record:
Last source checked.
Last record changed.
Last agent assessment.
Last score calculated.
Last human review.

#### 3.9 Behavioral intelligence
The IAM may receive permitted behavioral events from active client campaigns.
Examples include:
Email reply.
Internal referral.
Meeting booked.
Meeting completed.
Resource download.
Portal registration.
Due diligence request.
Data-room activity.
Accreditation verification started.
Accreditation verification completed.
Subscription started.
Subscription completed.
Capital funded.
Decline reason.
Future-interest indication.
Behavior must affect:
Current intent.
Timing.
Decision-path knowledge.
Offering fit.
Campaign priority.
Behavior must not independently establish:
Accreditation.
Family-office authenticity.
RIA alternatives capability.
Legal eligibility.

#### 3.10 Client campaign routing
Only offering-qualified capital sources should enter a client campaign database.
The client campaign database may receive:
Identity.
Contact details.
Category.
General qualification band.
Offering fit.
Relevant reason codes.
Outreach priority.
Recommended message angle.
Decision-maker role.
Campaign status.
The client campaign database should not receive:
Internal source contracts.
Detailed wealth estimates.
Another client’s campaign activity.
Restricted evidence.
Internal model features.
Another sponsor’s offering history.


### 4. Capital Source Lifecycle
Every source record should move through a defined lifecycle.

```
RAW SOURCE RECORD
↓
INGESTED
↓
IDENTITY RESOLVED
↓
RESEARCH CANDIDATE
↓
CATEGORY ASSESSED
↓
CONDITIONALLY QUALIFIED
↓
QUALIFIED CC UNIVERSE RECORD
↓
OFFERING MATCHED
↓
CAMPAIGN ELIGIBLE
↓
ENGAGED
↓
DUE DILIGENCE
↓
VERIFICATION / APPROVAL
↓
SUBSCRIBED
↓
FUNDED
↓
REINVESTMENT CANDIDATE
```

A record may also become:
Held.
Suppressed.
Disqualified.
Archived.
Expired.
Returned for further research.


### 5. Definition of a Qualified CC Universe Record
A record becomes a qualified CC Universe record only when it has passed the applicable category-specific process.
Required common fields
Canonical person or organization ID.
Capital-source category.
Identity confidence.
Category qualification status.
General qualification score.
Private-alternatives score.
Private real estate score.
Capital capability or account-capacity score.
Accessibility score.
Decision-maker coverage.
Evidence quality.
Reachability.
Reason codes.
Limitations.
Contradictions.
Last calculated date.
Requalification date.
Model version.
Audit status.
Common qualification bands
The normal minimum for entry into the active CC Universe should be:
General Qualification Score ≥ 70
Category-specific hard gates must also be satisfied.


### 6. Client and Offering Lifecycle

```
CLIENT ONBOARDED
↓
SPONSOR PROFILE CREATED
↓
OFFERING DOCUMENTS INGESTED
↓
OFFERING TERMS EXTRACTED
↓
OFFERING PROFILE APPROVED
↓
IDEAL INVESTOR PROFILE GENERATED
↓
CC UNIVERSE FILTERED
↓
CATEGORY-SPECIFIC FIT CALCULATED
↓
OVERLAP AND CONFLICT RULES APPLIED
↓
PROSPECTS PRIORITIZED
↓
CLIENT CAMPAIGN RECORDS CREATED
↓
OUTREACH AND NURTURE
↓
BEHAVIORAL FEEDBACK RETURNED
```


### 7. Maximum Active Raise Governance
Capital Context expects to operate approximately five active raises at one time.
The IAM must manage investor overlap among those offerings.
Required capital-source assignment statuses
Available.
Assigned to one active offering.
Eligible for multiple noncompeting offerings.
In active conversation.
In due diligence.
Cooling period.
Investor relationship protected.
Suppressed.
Investor requested multiple opportunities.
Conflict-management rules
Do not send materially competing offerings to the same investor simultaneously.
Prioritize the offering with the highest fit score.
Protect capital sources in active due diligence.
Consider relationship maturity.
Consider check-size allocation capacity.
Permit multiple opportunities only when appropriate and supported by evidence.
Record every assignment decision.
Never expose another client’s activity or offering information.


### 8. Core Technical Architecture
Recommended stack
PostgreSQL 16 or later.
Python 3.12.
FastAPI.
Pydantic.
SQLAlchemy.
Alembic.
Redis for caching and locks.
PostgreSQL-backed workflow queue initially.
Temporal as an optional later orchestration layer.
Object storage for approved source artifacts.
Approved LLM provider for extraction and classification.
Deterministic Python services for scoring.
SuiteCRM, Mautic, Smartlead, LinkedIn, portal, verification, and onboarding integrations.
Proposed project structure

```
ias_iam/
├── app/
│   ├── api/
│   ├── core/
│   │   ├── config/
│   │   ├── security/
│   │   ├── logging/
│   │   └── exceptions/
│   ├── database/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── migrations/
│   │   └── views/
│   ├── contracts/
│   │   ├── evidence.py
│   │   ├── capital_source.py
│   │   ├── agent.py
│   │   ├── offering.py
│   │   ├── fit.py
│   │   └── campaign.py
│   ├── shared/
│   │   ├── source_governance/
│   │   ├── ingestion/
│   │   ├── identity_resolution/
│   │   ├── evidence_ledger/
│   │   ├── scoring/
│   │   ├── audit/
│   │   ├── review/
│   │   ├── suppression/
│   │   └── orchestration/
│   ├── modules/
│   │   ├── hnw/
│   │   ├── family_office/
│   │   ├── ria/
│   │   └── offer_fit/
│   ├── integrations/
│   │   ├── suitecrm/
│   │   ├── mautic/
│   │   ├── smartlead/
│   │   ├── linkedin/
│   │   ├── investor_portal/
│   │   └── verification/
│   └── tests/
└── docs/
```


### 9. Shared Data Contracts

#### 9.1 Evidence item

```json
{
  "evidence_id": "uuid",
  "subject_type": "person",
  "subject_id": "uuid",
  "source_id": "uuid",
  "claim_code": "PRIVATE_REAL_ESTATE_INVESTMENT",
  "claim_value": {
    "property_type": "multifamily",
    "investment_structure": "closed_end_fund"
  },
  "polarity": "positive",
  "source_reliability": 0.90,
  "evidence_directness": 0.85,
  "extraction_confidence": 0.92,
  "observed_at": "2026-07-20T00:00:00Z",
  "valid_until": "2028-07-20T00:00:00Z",
  "source_reference": "approved-source-reference",
  "limitations": []
}
```


#### 9.2 Qualified capital-source record

```json
{
  "capital_source_id": "uuid",
  "category": "family_office",
  "person_id": null,
  "organization_id": "uuid",
  "qualification_status": "strong_qualified",
  "general_qualification_score": 82,
  "private_alternatives_score": 88,
  "private_real_estate_score": 79,
  "capital_capability_score": 84,
  "accessibility_score": 72,
  "decision_maker_coverage": 86,
  "evidence_quality": 89,
  "reachability_score": 77,
  "reason_codes": [
    "DIRECT_PRIVATE_INVESTMENT_HISTORY",
    "PRIVATE_CRE_ALLOCATION",
    "RELEVANT_DECISION_MAKER_IDENTIFIED"
  ],
  "limitations": [],
  "contradictions": [],
  "audit_status": "passed",
  "calculated_at": "2026-08-01T12:00:00Z",
  "requalification_due_at": "2026-11-01T12:00:00Z",
  "model_version": "fo-qualification-1.0"
}
```


#### 9.3 Offering profile

```json
{
  "offering_id": "uuid",
  "sponsor_id": "uuid",
  "offering_version": 1,
  "exemption": "506c",
  "vehicle_type": "open_ended_fund",
  "minimum_investment": 100000,
  "preferred_investment": 250000,
  "property_types": ["multifamily"],
  "strategies": ["core_plus", "value_add"],
  "geographies": ["texas", "southeast_us"],
  "target_return": {
    "irr_min": 0.13,
    "irr_max": 0.16
  },
  "income_orientation": 80,
  "appreciation_orientation": 65,
  "development_exposure": 25,
  "hold_period_years": {
    "minimum": 5,
    "maximum": 10
  },
  "liquidity": "limited_redemption",
  "tax_characteristics": ["depreciation"],
  "sponsor_track_record": {
    "years": 12,
    "completed_projects": 18
  },
  "approved": true
}
```


#### 9.4 Offering-fit assessment

```json
{
  "capital_source_id": "uuid",
  "offering_version_id": "uuid",
  "category": "ria",
  "general_qualification_score": 79,
  "offering_fit_score": 84,
  "fit_band": "strong",
  "evidence_coverage": 82,
  "decision_maker_fit": 88,
  "positive_reasons": [
    "PRIVATE_CRE_ALLOCATOR",
    "MULTIFAMILY_ALIGNMENT",
    "INCOME_ALIGNMENT",
    "CHECK_SIZE_ALIGNMENT"
  ],
  "mismatches": [],
  "hard_restrictions": [],
  "recommended_action": "priority_1_outreach"
}
```


## Part II — Claude Code Master Module Prompt

### Prompt 1: Develop the IAS IAM Primary System Module
You are a senior software architect and Python/PostgreSQL engineer.

Develop the primary Capital Context IAS Investor Acquisition Module, referred
to as IAS IAM.

The IAS IAM is part of a broader Investor Acquisition System for private
commercial real estate capital raises.

The IAM must build, maintain, qualify, and apply the proprietary Capital
Context Universe Database.

The Universe Database consists of three capital-source categories:

1. HNW and UHNW natural persons.
2. Family offices and their investment decision-makers.

### 3. RIA firms and advisers that allocate client capital to private
alternatives and private real estate.

A fourth primary submodule must build the client, sponsor, and offering
intelligence profile and match qualified capital sources from the three
categories to specific CRE offerings.


**SYSTEM PRINCIPLES**


1. The Universe Database is owned by Capital Context.
2. Client campaign databases are separate from the Universe Database.
3. Raw source records are not automatically qualified investor prospects.
4. Every material conclusion must be supported by evidence.
5. LLM agents may extract and classify evidence but must not calculate final
production scores.
6. Production scores must be calculated by deterministic, version-controlled
Python services.
7. The system must preserve source lineage.
8. The system must support daily incremental updates.
9. The system must ingest permitted behavioral and outcome events from IAS
client campaigns.
10. Client-specific campaign behavior must remain confidential.
11. The system must support no more than approximately five active raises at
one time and must manage investor overlap and assignment conflicts.
12. Use the term "due diligence" for the investor review process.


**DEVELOP THESE SHARED COMPONENTS**


1. Source Governance Service.
2. Raw Data Ingestion Service.
3. Person and Organization Identity Resolution.
4. Evidence Ledger.
5. Evidence Claim Registry.
6. Feature Registry.
7. Deterministic Scoring Framework.
8. Agent Execution Framework.
9. Agent JSON Input and Output Validation.
10. Workflow Orchestration.
11. Human Review Queue.
12. Evidence Audit Service.
13. Suppression and Contact Governance.
14. Behavioral Event Ingestion.
15. Client Export Gateway.
16. Capital-Source Assignment and Conflict Management.
17. Model Registry and Versioning.
18. Audit Logging.
19. Role-Based Access Control.
20. Monitoring and Error Reporting.


**TECHNOLOGY**


Use:

- Python 3.12.
- FastAPI.
- PostgreSQL 16.
- SQLAlchemy.
- Alembic.
- Pydantic.
- Redis only where appropriate.
- PostgreSQL-backed jobs for the initial workflow queue.
- Clean architecture and dependency injection.
- Unit tests and integration tests.
- Type hints throughout.
- Structured JSON logging.
- Environment-based configuration.
- Secrets must not appear in source code.


**DATABASE SCHEMAS**


Create:

- ias_core
- ias_score
- ias_ops
- ias_gateway


**CORE ENTITIES**


Implement models for:

- source_registry
- ingestion_batch
- raw_record
- person
- person_identifier
- contact_point
- organization
- employment
- person_organization_relationship
- evidence_item
- evidence_claim
- signal
- capital_source
- category_assessment
- professional_credential
- verification_attestation
- sponsor
- offering
- offering_profile_version
- feature_definition
- person_feature_value
- organization_feature_value
- model_registry
- offering_fit_assessment
- priority_assessment
- agent_run
- workflow_job
- review_queue
- suppression
- audit_event
- outcome_event
- client_export
- capital_source_assignment


**AGENT FRAMEWORK**


Every agent must use a standard request and response envelope.

Every agent result must include:

- agent name
- agent version
- contract version
- run ID
- input hash
- status
- evidence references
- warnings
- output payload
- model provider
- model name
- prompt version
- generation timestamp

Allowed agent statuses:

- complete
- partial
- insufficient_evidence
- contradictory
- failed

Reject agent outputs that:

- fail schema validation
- contain unsupported claims
- omit evidence references
- attempt to declare legal verification
- attempt to override suppression
- attempt to calculate an unapproved production score


**WORKFLOW REQUIREMENTS**


Implement event-driven workflows for:

- candidate.discovered
- source.record.updated
- identity.resolved
- evidence.updated
- category.assessment.required
- capital_source.qualified
- offering.created
- offering.updated
- offering.approved
- fit.recalculation.required
- campaign.behavior.received
- verification.updated
- subscription.updated
- capital.funded
- suppression.updated

Use idempotency keys.

Identical completed jobs must not run twice.


**CLIENT EXPORT RULES**


Only export capital sources when:

- category qualification is current
- evidence quality meets the minimum
- offering fit meets the minimum
- no hard restriction exists
- no active suppression exists
- assignment and overlap rules permit routing
- a relevant contact or decision-maker path exists

Do not export:

- detailed modeled wealth estimates
- restricted source content
- another client's campaign activity
- another sponsor's offering history
- internal model features
- source licensing information


**DELIVERABLES**


Produce:

1. Technical architecture document.
2. Database migrations.
3. SQLAlchemy models.
4. Pydantic contracts.
5. Repository layer.
6. Service layer.
7. Agent framework.
8. Workflow workers.
9. FastAPI endpoints.
10. Role and permission matrix.
11. Unit tests.
12. Integration tests.
13. Seed data for test environments.
14. Local development configuration.
15. Docker configuration.
16. API documentation.
17. Operational runbook.
18. Security notes.
19. Outstanding assumptions list.
20. Clear extension points for the HNW, Family Office, RIA, and Offer Fit
submodules.

Do not build category-specific qualification logic inside the shared module.
Create clean interfaces that the four primary submodules can implement.


## Part III — HNW Submodule Specification

### Prompt 2: Develop the HNW Investor Intelligence Submodule
Develop the HNW Investor Intelligence submodule for the Capital Context IAS
Investor Acquisition Module.


**PURPOSE**


Build and continually update a qualified universe of HNW and UHNW natural
persons who:

1. Have credible evidence that they may meet an accredited-investor pathway.

### 2. Have evidence of participation in or predisposition toward private
alternative investments.
3. Have evidence of private real estate relevance.
4. Have sufficient identity, contact, evidence, and fit information to be
evaluated against a specific CRE offering.

The system must never represent modeled accreditation probability as legal
verification.


**PRIMARY OUTPUT**


Create a qualified Capital Context Universe record for an HNW natural person.


**REQUIRED AGENTS**


### 1. HNW Source Discovery Agent
- Identify high-observability candidates.
- Use only approved sources.
- Do not infer wealth solely from job title.


### 2. HNW Identity Resolution Agent
- Resolve names, employers, ownership, LinkedIn, professional records,
company biographies, regulatory identifiers, and public records.
- Prevent false merges.


### 3. Professional Qualification Agent
- Identify current approved professional credentials.
- Distinguish active credentials from historical or inactive credentials.
- Mark offering-specific pathways separately.


### 4. Wealth and Income Evidence Agent
- Extract supported evidence of income, business ownership, liquidity
events, public beneficial ownership, commercial property ownership,
and licensed wealth estimates.
- Exclude the primary residence.
- Do not treat gross property value as equity.
- Do not assign business value without ownership evidence.
- Record liabilities and missing data.


### 5. Accreditation Assessment Service
- Deterministic service, not an LLM agent.
- Calculate accreditation evidence status or calibrated probability.
- Support:
verified
rule_qualified
probable_90
likely_75_89
possible_50_74
insufficient
contradicted
expired
- Before calibration is validated, use evidence bands rather than
probability claims.


### 6. Private Alternatives Propensity Agent
- Detect private funds, SPVs, syndications, angel investing, private
equity, venture, private credit, and direct private investments.


### 7. Private Real Estate Affinity Agent
- Detect direct real estate ownership, CRE fund history, private REITs,
syndications, private CRE debt, and property-specific preferences.
- Produce property, strategy, geography, structure, income, liquidity,
and risk vectors.


### 8. HNW Check-Size and Capital Capability Agent
- Estimate a broad plausible investment-capacity range.
- Do not produce unsupported exact liquidity or net-worth estimates.


### 9. Contact and Reachability Agent
- Find and validate professional contact paths.
- Enforce suppression.


### 10. HNW Evidence Audit Agent
- Challenge identity, financial assumptions, evidence duplication,
stale data, property-value assumptions, and weak propensity signals.


### 11. HNW Qualification Service
- Deterministically calculate the HNW general qualification score.


**HARD QUALIFICATION GATES**


A record may enter the active HNW Universe only when:

- identity confidence ≥ 0.95
- accreditation status is verified, rule-qualified, or approved probable band
- private alternatives score ≥ 60
- private real estate score ≥ 60
- evidence quality ≥ 70
- reachability meets the configured minimum
- no unresolved material contradiction exists
- no active suppression exists


**INITIAL HNW SCORE WEIGHTS**


- Accreditation status or evidence: 25%
- Private alternatives propensity: 25%
- Private real estate relevance: 20%
- Capital/check-size capability: 10%
- Reachability: 10%
- Evidence quality: 10%


**REQUIRED HNW DATA MODEL**


Add or extend:

- hnw_profile
- accreditation_assessment
- alternative_propensity_assessment
- cre_affinity_assessment
- capital_capability_assessment
- hnw_qualification_assessment
- hnw_reason_code_registry


**REQUIRED REASON CODES**


Include support for:


**- ACTIVE_QUALIFYING_CREDENTIAL**


**- DISCLOSED_COMPENSATION_HISTORY**


**- DOCUMENTED_BUSINESS_EXIT**


**- COMMERCIAL_PROPERTY_OWNERSHIP**


**- PRIVATE_FUND_HISTORY**


**- PRIVATE_REAL_ESTATE_HISTORY**


**- CRE_DEBT_EXPOSURE**


**- ANGEL_INVESTOR**


**- LIQUIDITY_EVENT**


**- CHECK_SIZE_ALIGNMENT**


**- INCOME_ORIENTATION**


**- DEVELOPMENT_TOLERANCE**


**- DAILY_LIQUIDITY_REQUIRED**


**- PRIVATE_REAL_ESTATE_REJECTED**


**- INSUFFICIENT_EVIDENCE**


**- MATERIAL_CONTRADICTION**


**WORKFLOW**


candidate discovered
→ source authorization
→ identity resolution
→ evidence extraction
→ feature calculation
→ accreditation assessment
→ alternatives propensity
→ private real estate affinity
→ capital capability
→ evidence audit
→ human review if required
→ category qualification
→ qualified CC Universe record


**TESTS**


Include tests confirming that:

- title alone does not establish accreditation
- a primary residence is excluded
- gross property value is not treated as equity
- one vendor wealth estimate cannot create a top qualification band
- behavioral engagement does not establish accreditation
- direct private investment history raises alternatives propensity
- public REIT interest alone does not prove private real estate allocation
- suppression blocks client export
- stale evidence expires the assessment


**DELIVERABLES**


Provide:

- migrations
- models
- Pydantic contracts
- prompts
- deterministic scoring services
- agent orchestration
- API endpoints
- review workflow
- tests
- documentation
- sample HNW qualified record


## Part IV — Family Office Submodule Specification

### Prompt 3: Develop the Family Office Intelligence Submodule
Develop the Family Office Intelligence submodule for the Capital Context IAS
Investor Acquisition Module.


**PURPOSE**


Build and continually update a qualified universe of family offices and family
investment organizations that:

1. Are genuine or sufficiently probable family offices.
2. Have credible capital capability.
3. Invest in private or alternative assets.
4. Have evidence of private real estate allocation or interest.
5. Can consider direct, fund, SPV, debt, or other private CRE offerings.
6. Have identifiable investment decision-makers.
7. Can be evaluated against a specific CRE sponsor and offering.


**PRIMARY OUTPUT**


Create a qualified Capital Context Universe record for a family-office
organization, with related decision-makers.


**REQUIRED AGENTS**


### 1. Family Office Discovery Agent
- Find candidate family offices, family investment companies, holding
companies, direct-investment organizations, and related entities.


### 2. Family Office Entity Resolution Agent
- Resolve names, family relationships where appropriately supported,
operating companies, holding entities, foundations, trusts, investment
entities, and related offices.


### 3. Family Office Authenticity and Classification Agent
- Classify:
confirmed_single_family_office
probable_single_family_office
multi_family_office
family_investment_company
family_holding_company
wealth_manager
service_provider
consultant
uncertain
- Prevent wealth managers and service providers from being mislabeled as
capital sources.


### 4. Capital Capability Agent
- Estimate broad capability based on documented exits, operating-company
ownership, known investment activity, portfolio scale, team depth, and
licensed estimates.
- Produce ranges, not unsupported exact wealth values.


### 5. Private Alternatives Activity Agent
- Detect private equity, venture, private credit, direct investments,
co-investments, private funds, and other non-public activity.


### 6. Private Real Estate Mandate Agent
- Detect private CRE investments, direct property ownership, CRE funds,
private real estate debt, preferred equity, development activity,
property types, strategies, and geographies.


### 7. Investment Structure Preference Agent
- Determine probable preference for:
single asset SPV
multi-asset SPV
closed-end fund
open-ended fund
evergreen vehicle
direct investment
co-investment
private REIT
debt fund


### 8. Family Office Accessibility Agent
- Assess whether the organization accepts third-party sponsors.
- Detect closed relationship models, consultant control, gatekeepers,
institutional barriers, or direct-access paths.


### 9. Decision-Maker Identification Agent
- Identify:
principal
family member
CIO
investment director
real estate head
portfolio manager
direct investment principal
CFO
external adviser
gatekeeper


### 10. Decision Authority Agent
- Classify:
final_decision
investment_committee_vote
recommendation
due_diligence
adviser
gatekeeper
influencer


### 11. Contact and Reachability Agent
- Validate professional contact paths.
- Link each contact to role and authority.


### 12. Family Office Evidence Audit Agent
- Challenge authenticity, capital assumptions, direct-investment claims,
decision authority, CRE relevance, stale transactions, and duplicate
entities.


### 13. Family Office Qualification Service
- Deterministically calculate the general qualification score.


**HARD QUALIFICATION GATES**


A family office may enter the active Universe only when:

- entity identity confidence ≥ 0.90
- classification is an approved family-office or family-investment type
- authenticity score ≥ 75
- capital capability score ≥ 60
- private alternatives score ≥ 65
- private real estate score ≥ 60
- at least one relevant decision-maker is identified
- evidence quality ≥ 70
- no unresolved service-provider or false-family-office flag exists
- no active suppression exists


**INITIAL FAMILY OFFICE SCORE WEIGHTS**


- Authenticity: 20%
- Capital capability: 20%
- Private alternatives activity: 20%
- Private real estate mandate: 20%
- Decision-maker coverage: 10%
- Evidence quality: 10%


**REQUIRED DATA MODEL**


Add or extend:

- family_office_profile
- family_office_classification_assessment
- family_office_capability_assessment
- family_office_mandate_assessment
- family_office_accessibility_assessment
- investment_responsibility
- family_office_qualification_assessment
- family_office_reason_code_registry


**REQUIRED REASON CODES**


Include:


**- CONFIRMED_SINGLE_FAMILY_OFFICE**


**- PROBABLE_SINGLE_FAMILY_OFFICE**


**- FAMILY_INVESTMENT_COMPANY**


**- DIRECT_PRIVATE_INVESTMENT_HISTORY**


**- PRIVATE_CRE_ALLOCATION**


**- REAL_ESTATE_DEBT_EXPOSURE**


**- CO_INVESTMENT_ACTIVITY**


**- DIRECT_DEAL_APPETITE**


**- THIRD_PARTY_SPONSOR_ACCESSIBLE**


**- PRINCIPAL_IDENTIFIED**


**- CIO_IDENTIFIED**


**- CRE_DECISION_MAKER_IDENTIFIED**


**- SERVICE_PROVIDER_FALSE_POSITIVE**


**- WEALTH_MANAGER_FALSE_POSITIVE**


**- CAPITAL_CAPABILITY_UNCERTAIN**


**- MANDATE_UNCONFIRMED**


**- MATERIAL_CONTRADICTION**


**WORKFLOW**


candidate organization
→ entity resolution
→ authenticity classification
→ capital capability
→ private alternatives activity
→ private real estate mandate
→ structure preferences
→ accessibility
→ decision-maker mapping
→ contact validation
→ evidence audit
→ human review if required
→ category qualification
→ qualified CC Universe record


**TESTS**


Include tests confirming that:

- an MFO is not automatically treated as an investing family office
- a service provider is rejected
- a wealth manager is not classified as an SFO without supporting evidence
- a documented family operating-company exit strengthens capital capability
- a direct property transaction strengthens CRE relevance
- one historical deal does not establish a permanent mandate
- a decision-maker must be current
- no family-office record is exported without a relevant contact path
- active due diligence creates an assignment-protection status


**DELIVERABLES**


Provide:

- migrations
- models
- contracts
- agent prompts
- deterministic scoring
- decision-maker mapping
- workflows
- APIs
- review screens
- tests
- documentation
- sample qualified family-office record


## Part V — RIA Submodule Specification

### Prompt 4: Develop the RIA Allocator Intelligence Submodule
Develop the RIA Allocator Intelligence submodule for the Capital Context IAS
Investor Acquisition Module.


**PURPOSE**


Build and continually update a qualified universe of RIA firms and advisers
that:

1. Serve a relevant private-client base.
2. Recommend, approve, or allocate client capital to non-public alternative
investments.
3. Have evidence of private real estate allocation or interest.
4. Can consider third-party CRE sponsors.
5. Have identifiable advisers or investment professionals with authority,
influence, or client-allocation responsibility.
6. Can be evaluated against a specific CRE offering.


**IMPORTANT CORRECTION**


The target is not primarily RIAs that advise or manage private funds.

Private-fund management is supporting, competitive, or exclusion evidence.

The primary qualification questions are:

1. Does the RIA allocate or advise client capital into non-public alternative
investments?
2. Does the RIA have evidence of private real estate interest or allocation?


**PRIMARY OUTPUT**


Create:

- a qualified RIA firm record
- qualified adviser and employee records
- a decision map
- firm-level and adviser-level offering-fit inputs


**STARTING SOURCES**


Support ingestion from:


**- SEC/IAPD**

- Form ADV Part 1
- Form ADV Schedule D
- Form ADV Part 2A
- Form CRS
- state adviser sources
- IAPD individual records
- FINRA BrokerCheck where appropriate
- RIA websites
- team biographies
- approved commercial contact sources
- IAS behavioral and outcome events


**REQUIRED AGENTS**


### 1. Regulatory Ingestion Agent
- Version every filing.
- Identify changed fields.
- Preserve CRD and SEC identifiers.


### 2. RIA Entity Resolution Agent
- Resolve legal names, DBAs, mergers, affiliates, domains, offices, and
related firms.


### 3. Registration and Operating Status Agent
- Classify active SEC RIA, active state RIA, ERA, inactive, withdrawn,
pending, or uncertain.


### 4. ADV Data Quality Agent
- Reconcile AUM, client categories, account counts, related entities, and
filing dates.
- Detect duplicated assets and stale information.


### 5. Relevant Client Base Agent
- Evaluate HNW, UHNW, family, trust, estate, and qualified-client relevance.
- Evaluate discretionary authority and practical account capacity.


### 6. Private Alternatives Allocation Agent
- Determine whether the RIA recommends or allocates client capital to:
private equity
private credit
venture capital
hedge funds
private funds
private real estate
direct private investments
limited partnerships
other non-public alternatives
- Distinguish private alternatives from liquid alternatives.


### 7. Private Real Estate Affinity Agent
- Determine whether private real estate is used or considered.
- Distinguish private real estate from public REIT exposure.
- Produce property, strategy, structure, geography, income, liquidity, and
risk vectors.


### 8. Third-Party Sponsor Accessibility Agent
- Determine whether the RIA can consider outside CRE sponsors.
- Assess open architecture, approved product lists, committee approval,
platform requirements, manager size requirements, track record,
custody, reporting, and emerging-manager willingness.


### 9. Competitive Conflict Agent
- Classify:
third_party_allocator
proprietary_and_third_party_allocator
proprietary_products_only
private_fund_manager_only
cre_sponsor_competitor
uncertain
- A firm remains qualified only when separate evidence supports external
client allocations.


### 10. RIA Employee Identity Agent
- Resolve advisers, owners, executives, researchers, portfolio managers,
committee members, and relevant professionals.


### 11. Employee Role Classification Agent
- Classify CIO, alternatives, real assets, private markets, portfolio
management, due diligence, senior adviser, founder, compliance,
operations, marketing, and irrelevant roles.


### 12. Investment Authority Agent
- Classify:
final_decision
investment_committee_vote
product_approval
research_recommendation
client_allocation_decision
due_diligence
adviser_influence
gatekeeper
introduction_path
no_relevant_authority


### 13. RIA Decision-Path Agent
- Map the firm's process from initial review through product approval and
client recommendation.


### 14. Contact and Reachability Agent
- Validate professional contact information and current employment.


### 15. RIA Evidence Audit Agent
- Challenge alternatives claims, private real estate claims, adviser
authority, third-party access, public REIT confusion, proprietary
products, and stale employment.


### 16. RIA Qualification Service
- Deterministically calculate the general qualification score.


**HARD QUALIFICATION GATES**


A firm may enter the active RIA Universe only when:

- active registration
- entity identity confidence ≥ 0.95
- relevant client base score ≥ 60
- private alternatives allocation score ≥ 65
- private real estate affinity score ≥ 60
- third-party sponsor accessibility ≥ 50
- at least one relevant adviser or decision-maker identified
- evidence quality ≥ 70
- not proprietary-products-only
- no active suppression


**INITIAL RIA SCORE WEIGHTS**


- Private alternatives allocation capability: 30%
- Private real estate affinity: 25%
- Relevant client base and account capacity: 15%
- Third-party sponsor accessibility: 15%
- Decision-maker coverage: 10%
- Evidence quality: 5%


**REQUIRED DATA MODEL**


Add or extend:

- ria_profile
- ria_filing_snapshot
- ria_client_composition
- ria_allocator_assessment
- ria_private_real_estate_assessment
- ria_accessibility_assessment
- ria_person_responsibility
- ria_decision_path
- ria_qualification_assessment
- ria_reason_code_registry


**REQUIRED REASON CODES**


Include:


**- ACTIVE_SEC_RIA**


**- ACTIVE_STATE_RIA**


**- HNW_CLIENT_BASE**


**- DISCRETIONARY_CLIENT_ASSETS**


**- CONFIRMED_PRIVATE_ALTERNATIVES_ALLOCATOR**


**- PROBABLE_PRIVATE_ALTERNATIVES_ALLOCATOR**


**- PRIVATE_CRE_ALLOCATOR**


**- PRIVATE_REAL_ESTATE_INTEREST**


**- PRIVATE_REAL_ESTATE_DEBT**


**- PUBLIC_REIT_ONLY**


**- LIQUID_ALTERNATIVES_ONLY**


**- THIRD_PARTY_MANAGER_ACCESSIBLE**


**- CENTRAL_APPROVAL_REQUIRED**


**- OPEN_ARCHITECTURE**


**- PROPRIETARY_PRODUCTS_ONLY**


**- PRIVATE_FUND_MANAGER_ONLY**


**- CRE_SPONSOR_COMPETITOR**


**- CIO_IDENTIFIED**


**- ALTERNATIVES_DIRECTOR_IDENTIFIED**


**- SENIOR_ADVISER_IDENTIFIED**


**- INVESTMENT_COMMITTEE_IDENTIFIED**


**- NO_RELEVANT_DECISION_MAKER**


**- MATERIAL_CONTRADICTION**


**WORKFLOW**


regulatory source
→ firm entity resolution
→ registration status
→ ADV data quality
→ relevant client base
→ private alternatives allocation
→ private real estate affinity
→ third-party accessibility
→ competitive conflict
→ employee resolution
→ role and authority
→ decision-path mapping
→ contact validation
→ evidence audit
→ human review if required
→ RIA category qualification
→ qualified firm and adviser Universe records


**TESTS**


Include tests confirming that:

- large AUM alone does not qualify a firm
- public REIT exposure does not prove private real estate allocation
- liquid alternatives do not prove private alternatives capability
- private-fund management does not prove third-party allocation
- proprietary-products-only firms are excluded
- an adviser title alone does not establish authority
- departed employees are not selected
- a firm without a relevant decision-maker cannot enter an active campaign
- suppression blocks export
- firm qualification and adviser qualification remain separate


**DELIVERABLES**


Provide:

- migrations
- models
- Pydantic contracts
- agent prompts
- deterministic scoring
- regulatory ingestion
- employee mapping
- decision-path mapping
- workflows
- APIs
- tests
- documentation
- sample qualified RIA firm
- sample qualified adviser record


## Part VI — Client and Offering Intelligence and Fit Submodule

### Prompt 5: Develop the Client and Offer Intelligence and Fit Engine
Develop the Client and Offer Intelligence and Fit submodule for the Capital
Context IAS Investor Acquisition Module.


**PURPOSE**


Create a complete structured profile for every IAS client, sponsor, and
offering and use that profile to identify, score, filter, prioritize, and
route qualified capital sources from the HNW, Family Office, and RIA
submodules.

This submodule is the bridge between the CC Universe Database and the client
campaign database.


**PRIMARY OUTPUTS**


1. Approved sponsor profile.
2. Approved offering profile.
3. Ideal capital-source profiles by category.
4. HNW offering-fit assessments.
5. Family-office offering-fit assessments.
6. RIA firm offering-fit assessments.
7. RIA adviser offering-fit assessments.
8. Capital-source assignment decisions.
9. Campaign routing records.
10. Fit-score learning from outcomes.


**REQUIRED AGENTS**


### 1. Client Intake Agent
- Normalize client organization, sponsor, team, strategy, history,
objectives, and operating capabilities.


### 2. Sponsor Intelligence Agent
- Extract:
sponsor history
completed projects
current portfolio
realized performance
team experience
co-investment
reporting capability
operating partners
legal and regulatory status
prior raises
investor relations history
geographic expertise
property expertise


### 3. Offering Document Ingestion Agent
- Ingest:
PPM
operating agreement
subscription agreement
investor deck
executive summary
underwriting
sponsor questionnaire
legal memoranda
portal documents
- Preserve document versions.


### 4. Offering Term Extraction Agent
- Extract:
exemption
vehicle type
target raise
minimum investment
preferred investment
property type
strategy
geography
return targets
current income
appreciation
leverage
development exposure
hold period
liquidity
redemption
fees
tax characteristics
investor eligibility
jurisdiction restrictions
subscription timing
sponsor contribution
track record
reporting
key risks


### 5. Offering Conflict and Consistency Agent
- Compare governing legal documents, deck, website, questionnaire, and
campaign messaging.
- Give legal documents priority.
- Flag conflicts.
- Do not activate an offering profile until approved.


### 6. Ideal Investor Profile Agent
- Create separate ideal profiles for:
HNW investors
family offices
RIAs
RIA advisers
- Define:
minimum capital capability
preferred check size
property preferences
strategy preferences
geography
risk
income
appreciation
liquidity
hold period
tax objectives
vehicle preferences
sponsor standards
timing


### 7. HNW Fit Service
- Deterministically score HNW Universe records.


### 8. Family Office Fit Service
- Deterministically score family-office records and decision-makers.


### 9. RIA Firm Fit Service
- Deterministically score RIA firms.


### 10. RIA Adviser Fit Service
- Select and score the correct adviser or investment professional.


### 11. Hard Restriction Agent
- Identify eligibility, jurisdiction, structure, minimum, liquidity,
sponsor-standard, product-platform, and conflict restrictions.


### 12. Capital-Source Assignment Agent
- Manage overlap among up to five active raises.
- Protect active conversations and due diligence.
- Prioritize the highest-fit offering.
- Allow multiple opportunities only when appropriate.


### 13. Campaign Routing Agent
- Create controlled client campaign records.
- Include only authorized fields.


### 14. Behavioral Feedback Agent
- Receive campaign events.
- Update timing, engagement, fit, decision paths, and priority.


### 15. Outcome Learning Agent
- Record:
positive reply
referral
meeting
due diligence
product approval
verification
subscription
funding
decline reason
future interest
- Preserve historical score snapshots.


**OFFERING-FIT PRINCIPLES**


1. General category qualification must occur before offering fit.
2. Unknown data must reduce coverage.
3. Unknown data must not be treated as a positive match.
4. Hard restrictions override fit score.
5. Fit scores must be category-specific.

### 6. Fit must be recalculated when:
- offering terms change
- source evidence changes
- decision-maker changes
- behavioral events occur
- verification or subscription status changes


**SHARED FIT DIMENSIONS**


- check-size alignment
- property-type alignment
- strategy alignment
- geography alignment
- risk and return alignment
- income versus appreciation
- hold period
- liquidity
- vehicle structure
- tax characteristics
- sponsor standards
- decision-maker relevance
- operational compatibility
- current timing


**INITIAL GENERAL FIT FORMULA**


For known dimensions:

Known Weighted Match =
Sum(weight × match × confidence × known)
divided by
Sum(weight × confidence × known)

Coverage =
Sum(weight × confidence × known)
divided by
Sum(all weights)

Adjusted Fit =
100 × Known Weighted Match × (0.60 + 0.40 × Coverage)


**FIT BANDS**


- 85–100: exceptional
- 75–84.99: strong
- 70–74.99: qualified
- 60–69.99: moderate
- 40–59.99: weak
- below 40: very weak
- hard restriction: disqualified


**CLIENT CAMPAIGN ELIGIBILITY**


Require:

- category qualification score ≥ 70
- offering fit score ≥ 70
- evidence coverage ≥ 65
- no hard restriction
- no active suppression
- relevant contact or decision-maker path
- assignment rules permit outreach


**PRIORITY 1**


- category qualification ≥ 80
- offering fit ≥ 85
- decision-maker fit ≥ 80 where applicable
- reachability ≥ 70
- no unresolved contradiction


**PRIORITY 2**


- category qualification ≥ 70
- offering fit ≥ 75
- reachability ≥ 60


**RESEARCH**


- strong category relevance
- offering fit may be strong
- one material information gap prevents routing


**ASSIGNMENT RULES**


Implement statuses:

- available
- assigned
- multi_offer_eligible
- active_conversation
- due_diligence
- cooling_period
- relationship_protected
- suppressed

The system must:

- avoid sending competing offerings simultaneously
- protect investors in active due diligence
- preserve assignment history
- allow authorized manual override
- record override reasons
- prevent client visibility into another client's campaign


**REQUIRED DATA MODEL**


Add or extend:

- client_profile
- sponsor_profile
- offering
- offering_document
- offering_profile_version
- ideal_investor_profile
- category_fit_configuration
- offering_fit_assessment
- adviser_offering_fit
- hard_restriction
- capital_source_assignment
- campaign_route
- fit_score_snapshot
- campaign_behavior_event
- investment_outcome
- offering_reason_code_registry

REQUIRED APIs

Implement:

POST /v1/clients
POST /v1/clients/{client_id}/sponsors
POST /v1/offerings
POST /v1/offerings/{offering_id}/documents
POST /v1/offerings/{offering_id}/extract-profile
POST /v1/offerings/{offering_id}/approve
POST /v1/offerings/{offering_id}/score-universe
GET  /v1/offerings/{offering_id}/prospects
GET  /v1/offerings/{offering_id}/conflicts
POST /v1/assignments/{assignment_id}/override
POST /v1/campaign-events
POST /v1/outcomes
GET  /v1/capital-sources/{capital_source_id}/offering-fits


**TESTS**


Include tests confirming that:

- an unapproved offering cannot score the Universe
- legal documents take priority over marketing material
- unknown dimensions reduce coverage
- a hard restriction overrides a high fit score
- an HNW fit model differs from an RIA fit model
- an RIA firm and its adviser are scored separately
- active due diligence protects the capital source from conflicting outreach
- two clients cannot view one another's campaign behavior
- historical scores remain unchanged after later recalculation
- funding outcomes are available as learning labels
- the same event is not processed twice


**DELIVERABLES**


Provide:

- migrations
- models
- Pydantic contracts
- agents
- prompts
- deterministic fit engines
- category-specific fit configurations
- conflict-management service
- campaign-routing service
- behavioral event processing
- APIs
- tests
- documentation
- sample client profile
- sample offering profile
- sample output for HNW, family office, RIA firm, and RIA adviser fits


## Part VII — Integration Requirements

### 1. Shared capital-source interface
Each category module must implement:

```python
class CapitalSourceModule(Protocol):
    def ingest_candidate(self, payload: dict) -> str:
        ...

    def resolve_identity(self, candidate_id: str) -> dict:
        ...

    def extract_evidence(self, capital_source_id: str) -> list[dict]:
        ...

    def calculate_qualification(self, capital_source_id: str) -> dict:
        ...

    def audit_qualification(self, capital_source_id: str) -> dict:
        ...

    def publish_qualified_record(self, capital_source_id: str) -> dict:
        ...

    def recalculate_after_event(
        self,
        capital_source_id: str,
        event: dict,
    ) -> dict:
        ...
```


### 2. Shared fit interface

```python
class OfferingFitService(Protocol):
    def calculate_fit(
        self,
        capital_source_id: str,
        offering_version_id: str,
    ) -> dict:
        ...

    def identify_hard_restrictions(
        self,
        capital_source_id: str,
        offering_version_id: str,
    ) -> list[dict]:
        ...

    def recommend_action(
        self,
        qualification: dict,
        fit: dict,
        assignment: dict,
    ) -> str:
        ...
```


### 3. Required event topics
source.record.created
source.record.updated
person.identity.updated
organization.identity.updated
evidence.created
evidence.expired
evidence.contradicted
capital_source.qualified
capital_source.disqualified
capital_source.requalification_due
offering.created
offering.profile.approved
offering.profile.changed
offering.fit.calculated
assignment.created
assignment.changed
campaign.behavior.received
due_diligence.started
verification.updated
subscription.updated
capital.funded
suppression.created
suppression.removed

### 4. Recalculation triggers
Recalculate category qualification when:
critical evidence is added.
evidence expires.
identity changes.
registration changes.
employer changes.
decision-maker changes.
a contradiction is found.
verification status changes.
Recalculate offering fit when:
offering terms change.
category qualification changes.
investor preference evidence changes.
a campaign behavior event occurs.
assignment status changes.
a hard restriction is added or removed.


## Part VIII — Development Sequence

### Phase 1: Shared IAM Foundation
Develop:
database schemas.
evidence ledger.
source registry.
identity framework.
agent framework.
scoring framework.
workflow queue.
audit logging.
review queue.
suppression.
client gateway.

### Phase 2: RIA Submodule
The RIA source data is already being assembled from public regulatory sources.
Develop first:
regulatory ingestion.
RIA firm qualification.
employee and adviser mapping.
private alternatives allocation.
private real estate affinity.
third-party accessibility.

### Phase 3: Family Office Submodule
Develop:
authenticity.
capital capability.
mandate.
decision-makers.
private CRE relevance.

### Phase 4: HNW Submodule
Develop:
identity.
accreditation evidence.
alternatives propensity.
private CRE relevance.
reachability.
qualification.

### Phase 5: Client and Offering Fit Engine
Develop:
sponsor intake.
offering ingestion.
structured offering profiles.
category-specific fit engines.
assignment conflicts.
client campaign routing.

### Phase 6: Behavioral and Outcome Learning
Connect:
Smartlead.
LinkedIn workflows.
Mautic.
SuiteCRM.
investor portal.
verification provider.
subscription workflow.
funded-investment records.


## Final System Definition
The IAS IAM should ultimately answer two questions.
Universe qualification question
Is this person or organization sufficiently identified, supported by evidence, relevant to private alternatives and private real estate, accessible, and qualified to become a proprietary Capital Context capital-source record?
Client offering question
Is this qualified capital source sufficiently aligned with this specific sponsor and offering to justify entering the client’s investor acquisition workflow?
The complete system logic is:

```
EXTERNAL SOURCE DATA
↓
CATEGORY-SPECIFIC AGENTS
↓
EVIDENCE-SUPPORTED QUALIFICATION
↓
QUALIFIED CC UNIVERSE RECORD
↓
CLIENT AND OFFER INTELLIGENCE
↓
CATEGORY-SPECIFIC FIT
↓
CAPITAL-SOURCE ASSIGNMENT
↓
CLIENT CAMPAIGN
↓
BEHAVIOR, DUE DILIGENCE, VERIFICATION, SUBSCRIPTION
↓
OUTCOME LEARNING
↓
IMPROVED CC UNIVERSE
```

The Capital Context competitive asset is not merely the quantity of records.
It is the combination of:
proprietary qualified capital-source intelligence.
category-specific agent processing.
offering-specific fit.
controlled application across a limited number of active raises.
campaign execution.
behavioral and outcome learning.


### Qualification Bands

| Score | Status |
|---|---|
| 85–100 | Core qualified |
| 75–84.99 | Strong qualified |
| 70–74.99 | Qualified |
| 60–69.99 | Further research |
| Below 60 | Not active-universe qualified |
