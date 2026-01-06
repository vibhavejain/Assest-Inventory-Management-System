# Product Requirements Document (PRD)
## Frontend Automation Testing for Asset Inventory Management System (AIMS)

**Version:** 1.0  
**Date:** January 6, 2026  
**Author:** Development Team  
**Status:** Draft  

---

## 1. Executive Summary

This document defines comprehensive requirements for frontend automation testing of the Asset Inventory Management System (AIMS). It covers component testing, integration testing, end-to-end (E2E) testing, visual regression testing, and accessibility testing to ensure a reliable, consistent, and user-friendly interface.

---

## 2. Frontend Architecture Overview

### 2.1 Technical Stack
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| React Router v6 | Client-side Routing |
| TailwindCSS | Styling |
| Vite | Build Tool & Dev Server |
| Lucide React | Icon Library |

### 2.2 Application Structure
```
ui/src/
├── api/                    # API client functions
│   └── index.ts           # All API calls (getUsers, createAsset, etc.)
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── ui/                # Reusable UI primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ExpandableCard.tsx
│   │   ├── Input.tsx
│   │   ├── Loading.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   └── Table.tsx
│   ├── AssetCard.tsx      # Asset display with assignment
│   ├── AuditLogCard.tsx   # Audit log display
│   ├── CompanyCard.tsx    # Company display with users/assets
│   └── UserCard.tsx       # User display with assignments
├── context/               # React Context providers
├── pages/
│   ├── Dashboard.tsx      # Overview statistics
│   ├── Companies.tsx      # Company list & management
│   ├── CompanyDetail.tsx  # Single company view
│   ├── Users.tsx          # User list & management
│   ├── Assets.tsx         # Asset list & management
│   ├── AuditLogs.tsx      # Audit log viewer
│   └── Settings.tsx       # Application settings
├── types/                 # TypeScript type definitions
├── App.tsx               # Route definitions
└── main.tsx              # Application entry point
```

### 2.3 Routing Structure
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview with statistics |
| `/companies` | Companies | List all companies |
| `/companies/:id` | CompanyDetail | Single company details |
| `/users` | Users | List all users |
| `/assets` | Assets | List all assets |
| `/audit-logs` | AuditLogs | View audit history |
| `/settings` | Settings | Application settings |

---

## 3. Testing Strategy

### 3.1 Testing Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  ← Few, slow, high confidence
                    │   Tests     │
                    └─────────────┘
               ┌─────────────────────┐
               │   Integration       │  ← Medium count, medium speed
               │      Tests          │
               └─────────────────────┘
          ┌───────────────────────────────┐
          │       Component Tests         │  ← Many, fast, focused
          └───────────────────────────────┘
     ┌─────────────────────────────────────────┐
     │           Unit Tests                    │  ← Most, fastest
     └─────────────────────────────────────────┘
```

### 3.2 Testing Frameworks

| Test Type | Framework | Purpose |
|-----------|-----------|---------|
| Unit Tests | Vitest | Utility functions, helpers |
| Component Tests | Vitest + React Testing Library | Individual component behavior |
| Integration Tests | Vitest + MSW | Component + API interaction |
| E2E Tests | Playwright | Full user workflows |
| Visual Regression | Playwright + Percy/Chromatic | UI consistency |
| Accessibility | axe-core + Playwright | WCAG compliance |

### 3.3 Test File Organization
```
ui/
├── src/
│   └── __tests__/
│       ├── unit/
│       │   ├── api.test.ts
│       │   └── utils.test.ts
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Badge.test.tsx
│       │   │   ├── Button.test.tsx
│       │   │   ├── Modal.test.tsx
│       │   │   └── ...
│       │   ├── AssetCard.test.tsx
│       │   ├── UserCard.test.tsx
│       │   └── CompanyCard.test.tsx
│       └── integration/
│           ├── Assets.test.tsx
│           ├── Users.test.tsx
│           └── Companies.test.tsx
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts
│   ├── pages/
│   │   ├── dashboard.spec.ts
│   │   ├── companies.spec.ts
│   │   ├── users.spec.ts
│   │   ├── assets.spec.ts
│   │   └── audit-logs.spec.ts
│   └── workflows/
│       ├── asset-assignment.spec.ts
│       ├── company-management.spec.ts
│       └── user-management.spec.ts
└── playwright.config.ts
```

---

## 4. UI Component Testing

### 4.1 Primitive UI Components

#### 4.1.1 Button Component
**File:** `ui/src/components/ui/Button.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Renders with text | `<Button>Click me</Button>` | Shows "Click me" text |
| Handles click | Click event fires | onClick callback invoked |
| Shows loading state | `loading={true}` | Shows spinner, disabled |
| Disabled state | `disabled={true}` | Cannot be clicked, styled disabled |
| Variant styles | `variant="primary\|secondary\|danger"` | Correct color scheme |
| Size variants | `size="sm\|md\|lg"` | Correct dimensions |

```typescript
// Example test
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables button', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### 4.1.2 Input Component
**File:** `ui/src/components/ui/Input.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Renders with label | `label="Email"` | Shows label text |
| Accepts input | Type in field | Value updates |
| Shows error state | `error="Required"` | Error message displayed, red border |
| Placeholder text | `placeholder="Enter..."` | Shows placeholder |
| Disabled state | `disabled={true}` | Cannot type, styled disabled |
| Required indicator | `required={true}` | Shows asterisk |

#### 4.1.3 Select Component
**File:** `ui/src/components/ui/Select.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Renders options | `options=[{value, label}]` | All options visible in dropdown |
| Selects option | Click option | Value updates, onChange fires |
| Shows placeholder | `placeholder="Select..."` | Placeholder shown when empty |
| Controlled value | `value="option1"` | Correct option selected |
| Disabled state | `disabled={true}` | Cannot open dropdown |

#### 4.1.4 Modal Component
**File:** `ui/src/components/ui/Modal.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Opens when isOpen=true | `isOpen={true}` | Modal visible |
| Closes on backdrop click | Click outside modal | onClose called |
| Closes on X button | Click close button | onClose called |
| Closes on Escape key | Press Escape | onClose called |
| Renders title | `title="Create User"` | Title displayed |
| Renders children | Child content | Content visible in modal body |
| Traps focus | Tab through modal | Focus stays within modal |

#### 4.1.5 Badge Component
**File:** `ui/src/components/ui/Badge.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Renders text | `<Badge>Active</Badge>` | Shows "Active" |
| Variant colors | `variant="success\|warning\|error\|info"` | Correct color scheme |
| Status mapping | `getStatusVariant('active')` | Returns 'success' |

#### 4.1.6 ExpandableCard Component
**File:** `ui/src/components/ui/ExpandableCard.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Renders header | `header={<div>Title</div>}` | Header visible |
| Initially collapsed | Default state | Children not visible |
| Expands on click | Click header | Children become visible |
| Collapses on second click | Click again | Children hidden |
| Chevron rotates | Expand/collapse | Icon rotates 180° |

#### 4.1.7 Table Component
**File:** `ui/src/components/ui/Table.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Renders headers | `columns=[...]` | All column headers shown |
| Renders rows | `data=[...]` | All data rows rendered |
| Empty state | `data=[]` | Shows empty message |
| Sortable columns | Click sortable header | Sort order changes |
| Row click handler | Click row | onRowClick called with row data |

#### 4.1.8 Loading Component
**File:** `ui/src/components/ui/Loading.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Shows spinner | Render component | Spinner animation visible |
| Full page variant | `fullPage={true}` | Covers entire viewport |
| Custom message | `message="Loading..."` | Message displayed |

#### 4.1.9 EmptyState Component
**File:** `ui/src/components/ui/EmptyState.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Shows icon | `icon={<Icon />}` | Icon rendered |
| Shows title | `title="No data"` | Title displayed |
| Shows description | `description="..."` | Description visible |
| Action button | `action={<Button>}` | Button rendered |

---

### 4.2 Business Components

#### 4.2.1 AssetCard Component
**File:** `ui/src/components/AssetCard.tsx`

**States to Test:**
| State | Condition | Visual Appearance |
|-------|-----------|-------------------|
| Collapsed | Default | Shows name, type badge, status |
| Expanded | After click | Shows details, assignment, activity |
| Loading | While fetching | Shows spinner |
| Assigned | `assigned_to` set | Shows user info with unassign button |
| Unassigned | `assigned_to` null | Shows user dropdown |
| Assigning | During API call | Button shows loading |

**Test Cases:**
| Test Case | User Action | Expected Result |
|-----------|-------------|-----------------|
| Expand card | Click header | Details section appears |
| Load details | Expand card | API calls for logs, company, users |
| Show assigned user | Asset has assigned_to | User name/email displayed |
| Assign user | Select user, click Assign | API called, UI updates |
| Unassign user | Click unassign button | API called, dropdown appears |
| Filter users by company | Expand card | Only company users in dropdown |
| Show audit logs | Expand card | Recent activity displayed |
| Delete asset | Click delete | Confirmation, then API call |

```typescript
// Example test
describe('AssetCard', () => {
  const mockAsset = {
    id: 'asset-1',
    name: 'Laptop',
    type: 'hardware',
    status: 'active',
    company_id: 'company-1',
    assigned_to: null,
  };

  it('expands to show details when clicked', async () => {
    render(<AssetCard asset={mockAsset} onDelete={vi.fn()} />);
    
    // Initially collapsed
    expect(screen.queryByText('Assigned To')).not.toBeInTheDocument();
    
    // Click to expand
    await userEvent.click(screen.getByText('Laptop'));
    
    // Now expanded
    expect(screen.getByText('Assigned To')).toBeInTheDocument();
  });

  it('shows only company users in assignment dropdown', async () => {
    // Mock API to return specific users
    server.use(
      rest.get('/users', (req, res, ctx) => {
        const companyId = req.url.searchParams.get('company_id');
        expect(companyId).toBe('company-1');
        return res(ctx.json({ success: true, data: mockCompanyUsers }));
      })
    );

    render(<AssetCard asset={mockAsset} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByText('Laptop'));
    
    // Verify dropdown contains only company users
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });
});
```

#### 4.2.2 UserCard Component
**File:** `ui/src/components/UserCard.tsx`

**States to Test:**
| State | Condition | Visual Appearance |
|-------|-----------|-------------------|
| Collapsed | Default | Shows name, email, status |
| Expanded | After click | Shows companies, assets, activity |
| No companies | Empty companyAccess | "No company assignments" message |
| Has companies | companyAccess populated | Company list with roles |
| No assets | Empty assignedAssets | "No assets assigned" message |
| Has assets | assignedAssets populated | Asset list with remove buttons |

**Test Cases:**
| Test Case | User Action | Expected Result |
|-----------|-------------|-----------------|
| Expand card | Click header | Details section appears |
| Show company assignments | Expand | Company names with roles |
| Show assigned assets | Expand | Asset list displayed |
| Assign asset | Select asset, click Assign | API called, asset added to list |
| Unassign asset | Click Remove | API called, asset removed |
| Filter assets by company | Expand | Only assets from user's companies |
| Delete user | Click delete | Confirmation, then API call |

#### 4.2.3 CompanyCard Component
**File:** `ui/src/components/CompanyCard.tsx`

**States to Test:**
| State | Condition | Visual Appearance |
|-------|-----------|-------------------|
| Collapsed | Default | Shows name, status, date |
| Expanded | After click | Shows users, assets, activity |
| No users | Empty companyUsers | "No users" message |
| Has users | companyUsers populated | User list with names |
| No assets | Empty assets | "No assets" message |
| Has assets | assets populated | Asset list with assignments |

**Test Cases:**
| Test Case | User Action | Expected Result |
|-----------|-------------|-----------------|
| Expand card | Click header | Details section appears |
| Show users with names | Expand | User names (not IDs) displayed |
| Show assets with assignments | Expand | Assets show assigned user names |
| Assign asset to user | Select user, click Assign | API called, UI updates |
| Navigate to detail | Click "View Details" | Routes to /companies/:id |
| Delete company | Click delete | Confirmation, then API call |

#### 4.2.4 AuditLogCard Component
**File:** `ui/src/components/AuditLogCard.tsx`

**Test Cases:**
| Test Case | Condition | Expected Result |
|-----------|-----------|-----------------|
| Show action type | action='create' | "Create" with icon |
| Show entity type | entity_type='asset' | "Asset" displayed |
| Show timestamp | created_at | Formatted date/time |
| Show changes | changes object | Before/after values |
| Expandable details | Click "View details" | Full changes JSON |

---

## 5. Page-Level Integration Tests

### 5.1 Dashboard Page
**File:** `ui/src/pages/Dashboard.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Load statistics | Page mount | Shows company, user, asset counts |
| Recent activity | Page mount | Shows recent audit logs |
| Quick actions | Click "Add Company" | Opens create modal |
| Navigation links | Click stat card | Navigates to respective page |
| Loading state | While fetching | Shows loading spinners |
| Error state | API fails | Shows error message |

### 5.2 Companies Page
**File:** `ui/src/pages/Companies.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| List companies | Page mount | Shows all companies |
| Create company | Fill form, submit | New company in list |
| Filter by status | Select status filter | List updates |
| Search companies | Type in search | List filters |
| Pagination | Click next page | New page loads |
| Empty state | No companies | Shows empty message with CTA |
| Delete company | Click delete, confirm | Company removed |

### 5.3 Users Page
**File:** `ui/src/pages/Users.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| List users | Page mount | Shows all users |
| Create user | Fill form, submit | New user in list |
| Validate email | Enter invalid email | Shows validation error |
| Duplicate email | Enter existing email | Shows error message |
| Filter by status | Select status filter | List updates |
| Filter by company | Select company filter | List updates |
| Delete user | Click delete, confirm | User removed |

### 5.4 Assets Page
**File:** `ui/src/pages/Assets.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| List assets | Page mount | Shows all assets |
| Create asset | Fill form, submit | New asset in list |
| Select company | Choose company | Company set on asset |
| Assign during create | Select user | Asset created with assignment |
| Filter by company | Select company filter | List updates |
| Filter by status | Select status filter | List updates |
| Filter by type | Select type filter | List updates |
| Delete asset | Click delete, confirm | Asset removed (if no history) |
| Delete with history | Click delete | Shows error about history |

### 5.5 Audit Logs Page
**File:** `ui/src/pages/AuditLogs.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Require company | Page mount | Company selector shown |
| Load logs | Select company | Logs for company displayed |
| Filter by entity | Select entity type | List filters |
| Filter by action | Select action type | List filters |
| Pagination | Click next | More logs loaded |
| View details | Click log entry | Expanded details shown |

### 5.6 Settings Page
**File:** `ui/src/pages/Settings.tsx`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Theme toggle | Click dark/light | Theme changes |
| Save settings | Click save | Settings persisted |
| Reset settings | Click reset | Defaults restored |

---

## 6. End-to-End (E2E) Test Workflows

### 6.1 Critical User Journeys

#### 6.1.1 Complete Company Setup Flow
```gherkin
Feature: Company Setup
  As an administrator
  I want to set up a new company with users and assets
  So that I can track the company's inventory

  Scenario: Create company, add user, create asset, assign asset
    Given I am on the Dashboard
    When I click "Add Company"
    And I fill in "Company Name" with "Acme Corp"
    And I click "Create"
    Then I should see "Acme Corp" in the companies list
    
    When I navigate to Users page
    And I click "Add User"
    And I fill in "Name" with "John Doe"
    And I fill in "Email" with "john@acme.com"
    And I click "Create"
    Then I should see "John Doe" in the users list
    
    When I navigate to Companies page
    And I expand "Acme Corp" card
    And I click "Add User"
    And I select "John Doe"
    And I click "Add"
    Then I should see "John Doe" under Acme Corp users
    
    When I navigate to Assets page
    And I click "Add Asset"
    And I select company "Acme Corp"
    And I fill in "Name" with "MacBook Pro"
    And I select type "hardware"
    And I click "Create"
    Then I should see "MacBook Pro" in the assets list
    
    When I expand "MacBook Pro" card
    And I select user "John Doe"
    And I click "Assign"
    Then I should see "John Doe" as assigned user
    And I should see an audit log entry for the assignment
```

#### 6.1.2 Asset Assignment Validation Flow
```gherkin
Feature: Asset Assignment Validation
  As a system
  I want to enforce that users can only be assigned assets from their companies
  So that data integrity is maintained

  Scenario: User without company access cannot see company assets
    Given user "Test User" has no company assignments
    And asset "Laptop" belongs to company "Nextgeek"
    When I expand "Test User" card
    Then I should not see "Laptop" in available assets dropdown
    
  Scenario: User with company access can see and assign company assets
    Given user "John Doe" is assigned to company "Nextgeek"
    And asset "Laptop" belongs to company "Nextgeek"
    When I expand "John Doe" card
    Then I should see "Laptop" in available assets dropdown
    When I select "Laptop" and click "Assign"
    Then "Laptop" should appear in assigned assets
```

#### 6.1.3 Audit Trail Verification Flow
```gherkin
Feature: Audit Trail
  As an administrator
  I want all changes to be logged
  So that I can track who did what and when

  Scenario: Asset assignment creates audit log
    Given I have an unassigned asset "Laptop"
    When I assign "Laptop" to user "John Doe"
    And I navigate to Audit Logs
    And I select company "Nextgeek"
    Then I should see an "update" entry for "asset"
    And the changes should show assigned_to from null to John's ID
```

#### 6.1.4 Data Persistence Flow
```gherkin
Feature: Data Persistence
  As a user
  I want my changes to persist after page refresh
  So that I don't lose my work

  Scenario: Asset assignment persists after refresh
    Given I assign asset "Laptop" to user "John Doe"
    When I refresh the page
    And I expand "Laptop" card
    Then I should see "John Doe" as assigned user
    
  Scenario: User card shows assigned assets after refresh
    Given asset "Laptop" is assigned to user "John Doe"
    When I refresh the page
    And I expand "John Doe" card
    Then I should see "Laptop" in assigned assets
```

### 6.2 E2E Test Implementation

```typescript
// e2e/workflows/asset-assignment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Asset Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Seed test data via API
    await seedTestData();
    await page.goto('/');
  });

  test('assigns asset to user from same company', async ({ page }) => {
    // Navigate to Assets
    await page.click('text=Assets');
    
    // Expand asset card
    await page.click('text=Test Laptop');
    
    // Wait for details to load
    await expect(page.locator('text=Assigned To')).toBeVisible();
    
    // Select user from dropdown
    await page.selectOption('[data-testid="user-select"]', 'user-1');
    
    // Click assign
    await page.click('button:has-text("Assign User")');
    
    // Verify assignment
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john@example.com')).toBeVisible();
  });

  test('persists assignment after page refresh', async ({ page }) => {
    // Assign asset
    await page.goto('/assets');
    await page.click('text=Test Laptop');
    await page.selectOption('[data-testid="user-select"]', 'user-1');
    await page.click('button:has-text("Assign User")');
    
    // Refresh page
    await page.reload();
    
    // Expand card again
    await page.click('text=Test Laptop');
    
    // Verify still assigned
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('creates audit log entry for assignment', async ({ page }) => {
    // Assign asset
    await page.goto('/assets');
    await page.click('text=Test Laptop');
    await page.selectOption('[data-testid="user-select"]', 'user-1');
    await page.click('button:has-text("Assign User")');
    
    // Navigate to audit logs
    await page.click('text=Audit Logs');
    await page.selectOption('[data-testid="company-select"]', 'company-1');
    
    // Verify log entry
    await expect(page.locator('text=Update')).toBeVisible();
    await expect(page.locator('text=asset')).toBeVisible();
  });
});
```

---

## 7. Visual Regression Testing

### 7.1 Components to Capture

| Component | States to Capture |
|-----------|-------------------|
| Button | default, hover, active, disabled, loading |
| Input | empty, filled, error, disabled, focused |
| Select | closed, open, selected, disabled |
| Modal | open with content |
| Badge | all variants (success, warning, error, info) |
| Card | default, hover |
| ExpandableCard | collapsed, expanded |
| Table | with data, empty, loading |

### 7.2 Page Screenshots

| Page | Scenarios |
|------|-----------|
| Dashboard | loaded with data, empty state |
| Companies | list view, create modal open |
| Users | list view, expanded card |
| Assets | list view, expanded with assigned user |
| Audit Logs | with logs, empty state |

### 7.3 Responsive Breakpoints

| Breakpoint | Width | Test Scenarios |
|------------|-------|----------------|
| Mobile | 375px | All pages, modals, cards |
| Tablet | 768px | All pages, sidebar behavior |
| Desktop | 1280px | All pages, full layout |
| Wide | 1920px | All pages, max-width constraints |

---

## 8. Accessibility Testing

### 8.1 WCAG 2.1 AA Requirements

| Criterion | Test Method |
|-----------|-------------|
| 1.1.1 Non-text Content | All images have alt text |
| 1.3.1 Info and Relationships | Semantic HTML, ARIA labels |
| 1.4.3 Contrast | Color contrast ratio ≥ 4.5:1 |
| 2.1.1 Keyboard | All interactive elements keyboard accessible |
| 2.4.3 Focus Order | Logical tab order |
| 2.4.7 Focus Visible | Clear focus indicators |
| 4.1.2 Name, Role, Value | ARIA attributes correct |

### 8.2 Automated Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('Dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Modal traps focus correctly', async ({ page }) => {
    await page.goto('/companies');
    await page.click('text=Add Company');
    
    // Focus should be in modal
    await expect(page.locator('[role="dialog"]')).toBeFocused();
    
    // Tab should cycle within modal
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="name"]')).toBeFocused();
  });

  test('All interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/assets');
    
    // Tab to first card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Enter to expand
    await page.keyboard.press('Enter');
    
    // Verify expanded
    await expect(page.locator('text=Assigned To')).toBeVisible();
  });
});
```

---

## 9. Test Data Management

### 9.1 Test Fixtures

```typescript
// e2e/fixtures/test-data.ts
export const testCompany = {
  id: 'test-company-1',
  name: 'Test Company',
  status: 'active',
};

export const testUser = {
  id: 'test-user-1',
  name: 'John Doe',
  email: 'john@test.com',
  status: 'active',
};

export const testAsset = {
  id: 'test-asset-1',
  name: 'Test Laptop',
  type: 'hardware',
  status: 'active',
  company_id: 'test-company-1',
  assigned_to: null,
};

export const testCompanyAccess = {
  id: 'test-access-1',
  user_id: 'test-user-1',
  company_id: 'test-company-1',
  role: 'ADMIN',
};
```

### 9.2 API Mocking (MSW)

```typescript
// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('*/companies', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: [testCompany],
    }));
  }),
  
  rest.get('*/users', (req, res, ctx) => {
    const companyId = req.url.searchParams.get('company_id');
    const users = companyId 
      ? [testUser].filter(u => /* filter logic */)
      : [testUser];
    return res(ctx.json({ success: true, data: users }));
  }),
  
  rest.patch('*/assets/:id', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: { ...testAsset, ...req.body },
    }));
  }),
];
```

### 9.3 Database Seeding for E2E

```typescript
// e2e/fixtures/seed.ts
export async function seedTestData(apiUrl: string) {
  // Create company
  const company = await fetch(`${apiUrl}/companies`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Company', status: 'active' }),
  }).then(r => r.json());

  // Create user
  const user = await fetch(`${apiUrl}/users`, {
    method: 'POST',
    body: JSON.stringify({ 
      name: 'John Doe', 
      email: `john-${Date.now()}@test.com`,
      status: 'active',
    }),
  }).then(r => r.json());

  // Add user to company
  await fetch(`${apiUrl}/companies/${company.data.id}/users`, {
    method: 'POST',
    body: JSON.stringify({ user_id: user.data.id, role: 'ADMIN' }),
  });

  // Create asset
  const asset = await fetch(`${apiUrl}/assets`, {
    method: 'POST',
    body: JSON.stringify({
      company_id: company.data.id,
      name: 'Test Laptop',
      type: 'hardware',
      status: 'active',
    }),
  }).then(r => r.json());

  return { company: company.data, user: user.data, asset: asset.data };
}
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/frontend-tests.yml
name: Frontend Tests

on:
  push:
    paths:
      - 'ui/**'
  pull_request:
    paths:
      - 'ui/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd ui && npm ci
      - name: Run unit tests
        run: cd ui && npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd ui && npm ci
      - run: cd ui && npm run test:components

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install dependencies
        run: |
          npm ci
          cd ui && npm ci
      - name: Install Playwright
        run: cd ui && npx playwright install --with-deps
      - name: Start backend
        run: npm run dev &
      - name: Start frontend
        run: cd ui && npm run dev &
      - name: Wait for servers
        run: npx wait-on http://localhost:5173 http://localhost:8787
      - name: Run E2E tests
        run: cd ui && npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: ui/playwright-report/
```

### 10.2 Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage src/__tests__/unit",
    "test:components": "vitest run src/__tests__/components",
    "test:integration": "vitest run src/__tests__/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test e2e/accessibility.spec.ts",
    "test:visual": "playwright test --update-snapshots"
  }
}
```

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Component Test Coverage | ≥ 90% | Vitest coverage report |
| E2E Critical Path Coverage | 100% | All workflows passing |
| Test Execution Time | < 3 min (unit), < 10 min (E2E) | CI timing |
| Flaky Test Rate | < 1% | Failed tests / total runs |
| Visual Regression Catches | Track monthly | Percy/Chromatic reports |
| Accessibility Violations | 0 critical | axe-core reports |

---

## 12. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Vitest with React Testing Library
- [ ] Set up MSW for API mocking
- [ ] Write tests for all UI primitive components
- [ ] Achieve 90% coverage on ui/ components

### Phase 2: Business Components (Week 3-4)
- [ ] Write tests for AssetCard, UserCard, CompanyCard
- [ ] Write tests for AuditLogCard
- [ ] Integration tests with mocked API

### Phase 3: Page Integration (Week 5-6)
- [ ] Set up Playwright
- [ ] Write E2E tests for critical workflows
- [ ] Set up visual regression testing

### Phase 4: Polish (Week 7-8)
- [ ] Accessibility testing
- [ ] CI/CD integration
- [ ] Documentation and training
- [ ] Performance optimization

---

## 13. Appendix

### 13.1 Test Selectors Strategy

Use `data-testid` attributes for reliable test selectors:

```tsx
// Component
<button data-testid="assign-user-btn">Assign User</button>
<select data-testid="user-select">...</select>

// Test
await page.click('[data-testid="assign-user-btn"]');
await page.selectOption('[data-testid="user-select"]', 'user-1');
```

### 13.2 Common Test Utilities

```typescript
// src/__tests__/utils/render.tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

export function renderWithRouter(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
}

// src/__tests__/utils/wait.ts
export async function waitForLoadingToFinish() {
  await waitForElementToBeRemoved(() => 
    screen.queryByTestId('loading-spinner')
  );
}
```

### 13.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-06 | Dev Team | Initial draft |
