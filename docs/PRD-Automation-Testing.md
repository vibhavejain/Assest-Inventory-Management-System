# Product Requirements Document (PRD)
## Automation Testing for Asset Inventory Management System (AIMS)

**Version:** 1.0  
**Date:** January 5, 2026  
**Author:** Development Team  
**Status:** Draft  

---

## 1. Executive Summary

This document defines the requirements for implementing comprehensive automation testing for the Asset Inventory Management System (AIMS). The goal is to ensure system reliability, reduce manual testing effort, enable continuous integration/deployment (CI/CD), and maintain high code quality across all system components.

---

## 2. Product Overview

### 2.1 System Description
AIMS is a cloud-based asset inventory management platform that enables organizations to:
- Track and manage hardware, software, and license assets
- Assign assets to users within companies
- Maintain audit trails for all asset operations
- Manage multi-tenant company structures with role-based access

### 2.2 Technical Stack
| Component | Technology |
|-----------|------------|
| Backend API | Cloudflare Workers (TypeScript) |
| Database | Cloudflare D1 (SQLite) |
| Frontend | React + TypeScript + Vite |
| Styling | TailwindCSS |
| Deployment | Cloudflare Workers & Pages |

### 2.3 Core Entities
- **Companies** - Organizations that own assets
- **Users** - Individuals who can be assigned to companies and assets
- **Assets** - Hardware, software, or licenses tracked in the system
- **Company Access** - User-to-company assignments with roles
- **Audit Logs** - Historical record of all system changes

---

## 3. Testing Objectives

### 3.1 Primary Goals
1. **Reliability** - Ensure all features work correctly across releases
2. **Regression Prevention** - Catch bugs before they reach production
3. **CI/CD Enablement** - Automate testing in deployment pipeline
4. **Documentation** - Tests serve as living documentation of expected behavior
5. **Confidence** - Enable rapid development with safety net

### 3.2 Success Metrics
| Metric | Target |
|--------|--------|
| Code Coverage | ≥ 80% |
| Critical Path Coverage | 100% |
| Test Execution Time | < 5 minutes (unit), < 15 minutes (E2E) |
| Flaky Test Rate | < 2% |
| Bug Escape Rate | < 5% of production bugs |

---

## 4. Testing Scope

### 4.1 In Scope

#### 4.1.1 Backend API Testing
| Category | Description |
|----------|-------------|
| Unit Tests | Individual function/module testing |
| Integration Tests | API endpoint testing with database |
| Validation Tests | Input validation and error handling |
| Authorization Tests | Role-based access control verification |

#### 4.1.2 Frontend Testing
| Category | Description |
|----------|-------------|
| Component Tests | Individual React component testing |
| Integration Tests | Component interaction testing |
| E2E Tests | Full user workflow testing |
| Visual Regression | UI appearance consistency |

#### 4.1.3 API Contract Testing
- Request/response schema validation
- Error response format consistency
- Pagination behavior
- Rate limiting behavior

### 4.2 Out of Scope (Phase 1)
- Performance/load testing
- Security penetration testing
- Mobile responsiveness testing
- Accessibility (a11y) testing
- Internationalization (i18n) testing

---

## 5. Test Categories & Requirements

### 5.1 Unit Tests

#### 5.1.1 Backend Unit Tests
**Location:** `src/__tests__/unit/`

| Module | Test Requirements |
|--------|-------------------|
| `validation.ts` | All validation functions with valid/invalid inputs |
| `response.ts` | Response helper functions |
| Database helpers | CRUD operation logic |

**Example Test Cases:**
```
- validateCreateUser: valid user data → returns valid: true
- validateCreateUser: missing email → returns error for email field
- validateCreateUser: invalid email format → returns validation error
- validateUpdateAsset: assigned_to as null → valid
- validateUpdateAsset: assigned_to as string → valid
- validateUpdateAsset: assigned_to as number → invalid
```

#### 5.1.2 Frontend Unit Tests
**Location:** `ui/src/__tests__/unit/`

| Component | Test Requirements |
|-----------|-------------------|
| UI Components | Badge, Button, Select, Modal rendering |
| Utility Functions | Date formatting, status helpers |
| API Functions | Request formation, response parsing |

### 5.2 Integration Tests

#### 5.2.1 API Integration Tests
**Location:** `src/__tests__/integration/`

**Companies API:**
| Endpoint | Test Cases |
|----------|------------|
| `GET /companies` | List with pagination, filtering by status |
| `POST /companies` | Create valid company, duplicate name handling |
| `PATCH /companies/:id` | Update fields, invalid ID handling |
| `DELETE /companies/:id` | Delete empty company, prevent delete with assets |

**Users API:**
| Endpoint | Test Cases |
|----------|------------|
| `GET /users` | List all, filter by status, filter by company_id |
| `POST /users` | Create valid user, duplicate email handling |
| `PATCH /users/:id` | Update fields, status transitions |
| `DELETE /users/:id` | Delete user, cascade behavior |
| `GET /users/:id/companies` | List user's company assignments |

**Assets API:**
| Endpoint | Test Cases |
|----------|------------|
| `GET /assets` | List all, filter by company, filter by status |
| `POST /assets` | Create with valid company, invalid company handling |
| `PATCH /assets/:id` | Update fields, assign/unassign user |
| `DELETE /assets/:id` | Delete asset, prevent delete with history |

**Company Access API:**
| Endpoint | Test Cases |
|----------|------------|
| `GET /companies/:id/users` | List company users |
| `POST /companies/:id/users` | Add user to company |
| `DELETE /companies/:id/users/:userId` | Remove user from company |

**Audit Logs API:**
| Endpoint | Test Cases |
|----------|------------|
| `GET /audit-logs` | List by company, pagination |
| Automatic logging | Verify logs created for CRUD operations |

#### 5.2.2 Frontend Integration Tests
**Location:** `ui/src/__tests__/integration/`

| Feature | Test Cases |
|---------|------------|
| AssetCard | Expand, load details, assign user, unassign user |
| UserCard | Expand, view companies, assign asset, unassign asset |
| CompanyCard | Expand, view users, view assets, assign asset to user |
| Create Modals | Form validation, submission, error handling |

### 5.3 End-to-End (E2E) Tests

#### 5.3.1 Critical User Workflows
**Location:** `ui/e2e/`

**Workflow 1: Company Setup**
```
1. Create new company
2. Verify company appears in list
3. Add user to company
4. Verify user has company access
5. Create asset for company
6. Verify asset appears under company
```

**Workflow 2: Asset Assignment**
```
1. Navigate to Assets page
2. Expand asset card
3. Select user from dropdown (only company users shown)
4. Click Assign
5. Verify assignment persists after refresh
6. Verify audit log entry created
7. Unassign user
8. Verify unassignment persists
```

**Workflow 3: User Management**
```
1. Create new user
2. Assign user to company
3. Verify user can see company's assets
4. Assign asset to user
5. Verify asset appears in user's assigned assets
6. Remove user from company
7. Verify asset is unassigned (or blocked)
```

**Workflow 4: Audit Trail Verification**
```
1. Perform create operation
2. Verify audit log entry with 'create' action
3. Perform update operation
4. Verify audit log entry with 'update' action and changes
5. Verify changes object contains from/to values
```

#### 5.3.2 Edge Cases & Error Handling
| Scenario | Expected Behavior |
|----------|-------------------|
| Assign asset to user not in company | Should not be possible (UI prevents) |
| Delete company with assets | Should be blocked with error message |
| Delete user with assigned assets | Assets should be unassigned or blocked |
| Create duplicate email | Should show validation error |
| Network failure during save | Should show error, allow retry |

### 5.4 Validation Tests

#### 5.4.1 Input Validation Matrix

**User Creation:**
| Field | Valid | Invalid |
|-------|-------|---------|
| name | "John Doe" | "", null, 256+ chars |
| email | "john@example.com" | "", "invalid", duplicate |
| status | "active", "inactive" | "unknown", null |
| primary_company_id | valid UUID, null | invalid UUID |

**Asset Creation:**
| Field | Valid | Invalid |
|-------|-------|---------|
| company_id | valid UUID | "", null, invalid UUID |
| name | "Laptop-001" | "", null |
| type | "hardware", "software", "license" | "unknown" |
| status | "active", "inactive", "maintenance" | "unknown" |
| identifier | "SN-12345" | null allowed |
| assigned_to | valid user UUID, null | invalid UUID |

**Company Creation:**
| Field | Valid | Invalid |
|-------|-------|---------|
| name | "Acme Corp" | "", null, duplicate |
| status | "active", "inactive" | "unknown" |

---

## 6. Test Infrastructure

### 6.1 Testing Frameworks

| Layer | Framework | Rationale |
|-------|-----------|-----------|
| Backend Unit | Vitest | Fast, TypeScript native, Vite compatible |
| Backend Integration | Vitest + Miniflare | Cloudflare Workers local testing |
| Frontend Unit | Vitest + React Testing Library | Component testing |
| Frontend E2E | Playwright | Cross-browser, reliable, fast |

### 6.2 Test Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Test Environment                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Vitest    │    │  Miniflare  │    │ Playwright  │ │
│  │  (Unit)     │    │  (Workers)  │    │   (E2E)     │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                  │                  │         │
│         ▼                  ▼                  ▼         │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Test Database (D1 Local)               ││
│  │         Seeded with consistent test data            ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 6.3 Test Data Management

**Seed Data Requirements:**
- 3 companies (active, inactive, empty)
- 5 users (various statuses, company assignments)
- 10 assets (various types, statuses, assignments)
- Pre-existing audit logs

**Data Isolation:**
- Each test suite uses fresh database state
- Tests should not depend on execution order
- Cleanup after test completion

### 6.4 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## 7. Test Prioritization

### 7.1 Priority Matrix

| Priority | Category | Criteria |
|----------|----------|----------|
| P0 - Critical | Core CRUD operations | System unusable if broken |
| P1 - High | Asset assignment, audit logging | Key business features |
| P2 - Medium | Filtering, pagination, UI states | Important but workarounds exist |
| P3 - Low | Edge cases, cosmetic issues | Nice to have |

### 7.2 Phase 1 Implementation (MVP)

**Week 1-2:**
- [ ] Set up Vitest for backend
- [ ] Unit tests for validation.ts (100% coverage)
- [ ] Unit tests for response.ts
- [ ] API integration tests for Companies CRUD

**Week 3-4:**
- [ ] API integration tests for Users CRUD
- [ ] API integration tests for Assets CRUD
- [ ] API integration tests for Company Access
- [ ] Audit log verification tests

**Week 5-6:**
- [ ] Set up Playwright for E2E
- [ ] E2E tests for critical workflows
- [ ] CI/CD pipeline integration
- [ ] Test coverage reporting

---

## 8. Acceptance Criteria

### 8.1 Phase 1 Completion
- [ ] All P0 and P1 test cases implemented
- [ ] Code coverage ≥ 80% for backend
- [ ] All tests passing in CI/CD pipeline
- [ ] Test execution time < 10 minutes total
- [ ] Documentation for running tests locally

### 8.2 Quality Gates
| Gate | Requirement |
|------|-------------|
| PR Merge | All tests passing |
| Staging Deploy | All tests passing + coverage check |
| Production Deploy | All tests passing + manual smoke test |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flaky E2E tests | CI/CD delays | Retry logic, stable selectors |
| Test data pollution | False positives/negatives | Database reset per suite |
| Slow test execution | Developer friction | Parallel execution, selective runs |
| Maintenance burden | Outdated tests | Tests as part of feature PRs |

---

## 10. Appendix

### 10.1 Glossary
- **AIMS** - Asset Inventory Management System
- **E2E** - End-to-End testing
- **CI/CD** - Continuous Integration/Continuous Deployment
- **CRUD** - Create, Read, Update, Delete

### 10.2 References
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Miniflare](https://miniflare.dev/)

### 10.3 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | Dev Team | Initial draft |
