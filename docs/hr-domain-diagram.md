# AL METHER HR Domain Diagram

This diagram is the shared HR reference for future Studio and AI modules. `employee_code` is the stable domain identity. Auth accounts and operation records are integrations, not duplicate people.

```mermaid
erDiagram
  COMPANIES ||--o{ HR_ORGANIZATIONS : owns
  HR_ORGANIZATIONS ||--o{ HR_DEPARTMENTS : contains
  HR_DEPARTMENTS ||--o{ HR_TEAMS : contains
  HR_EMPLOYEES ||--o{ HR_EMPLOYEE_PLACEMENTS : has_history
  HR_ORGANIZATIONS ||--o{ HR_EMPLOYEE_PLACEMENTS : scopes
  HR_DEPARTMENTS ||--o{ HR_EMPLOYEE_PLACEMENTS : scopes
  HR_TEAMS ||--o{ HR_EMPLOYEE_PLACEMENTS : scopes

  PROFILES o|--o| HR_EMPLOYEES : portal_account
  OPERATION_PERSONNEL o|--o| HR_EMPLOYEES : operation_identity

  PROFILES ||--o{ HR_ACCESS_GRANTS : receives
  HR_ORGANIZATIONS o|--o{ HR_ACCESS_GRANTS : organization_scope
  HR_DEPARTMENTS o|--o{ HR_ACCESS_GRANTS : department_scope
  HR_EMPLOYEES o|--o{ HR_ACCESS_GRANTS : self_scope

  HR_EMPLOYEES ||--o{ HR_EMPLOYEE_FILES : owns
  HR_EMPLOYEES ||--o{ HR_LEAVE_REQUESTS : requests
  HR_EMPLOYEES ||--o{ HR_PAYROLL_RECORDS : receives
  HR_EMPLOYEES ||--o{ HR_ASSET_ASSIGNMENTS : assigned

  HR_DOCUMENTS ||--o{ HR_DOCUMENT_VERSIONS : versions
  HR_DOCUMENTS ||--o{ HR_DOCUMENT_RECIPIENTS : delivered
  HR_EMPLOYEES ||--o{ HR_DOCUMENT_RECIPIENTS : receives
  HR_DOCUMENTS ||--o{ HR_DOCUMENT_AUDIT_EVENTS : document_evidence

  COMPANIES ||--o{ HR_EVENTS : business_history
  COMPANIES ||--|| HR_READ_MODELS : projection
  COMPANIES ||--o{ HR_SECURITY_AUDIT_LOGS : security_history
```

## Identity boundaries

```mermaid
flowchart LR
  A["Supabase Auth UID"] -->|optional portal account| E["HR Employee · employee_code"]
  O["Operation Personnel · PMTHR QR"] -->|one-to-one employee_code link| E
  E --> P["Effective-dated placements"]
  P --> ORG["Organization"]
  P --> DEP["Department"]
  P --> TEAM["Team"]
```

## Write and read flow

```mermaid
flowchart LR
  UI["HR UI"] --> R["HrRepository"]
  R --> API["Authorized HR API"]
  API --> RLS["Supabase RLS + access grants"]
  RLS --> EVT["hr_events · append-only"]
  EVT --> RED["HR reducer/projection"]
  RED --> RM["hr_read_models"]
  RM --> R
  API --> AUD["hr_security_audit_logs"]
```

`hr_events` is business history. `hr_security_audit_logs` records access/security outcomes and never substitutes for the event stream.
