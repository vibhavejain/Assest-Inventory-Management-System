# Asset Inventory Management System

A production-grade, multi-tenant Asset Inventory backend built on **Cloudflare Workers + D1**.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers Edge                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routing   │→ │ Validation  │→ │     Persistence         │  │
│  │  (index.ts) │  │ (validation)│  │  (db/* modules)         │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
│                                                 │                │
│                                    ┌────────────▼────────────┐  │
│                                    │    Audit Logging        │  │
│                                    │  (immutable, always)    │  │
│                                    └────────────┬────────────┘  │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │     Cloudflare D1         │
                                    │   (SQLite-compatible)     │
                                    └───────────────────────────┘
```

## Features

- **Multi-tenant**: Company-scoped data isolation
- **Stateless REST API**: Cloudflare Workers native
- **Immutable Audit Logs**: Every mutation is tracked
- **Strictly Typed**: Full TypeScript with ES2022
- **Production Ready**: CI/CD with GitHub Actions

## Project Structure

```
src/
├── index.ts              # Main Worker entry point
├── types/
│   └── index.ts          # TypeScript interfaces
├── db/
│   ├── index.ts          # Database exports
│   ├── audit.ts          # Audit logging
│   ├── companies.ts      # Companies CRUD
│   ├── users.ts          # Users CRUD
│   ├── company-access.ts # Company access management
│   └── assets.ts         # Assets CRUD
├── routes/
│   ├── index.ts          # Route exports
│   ├── companies.ts      # /companies endpoints
│   ├── users.ts          # /users endpoints
│   ├── company-access.ts # /companies/:id/users endpoints
│   ├── assets.ts         # /assets endpoints
│   └── audit-logs.ts     # /audit-logs endpoints
└── utils/
    ├── response.ts       # HTTP response helpers
    └── validation.ts     # Input validation
migrations/
└── 0001_initial_schema.sql
.github/
└── workflows/
    └── deploy.yml        # CI/CD pipeline
```

## API Endpoints

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/companies` | Create a company |
| GET | `/companies` | List all companies |
| GET | `/companies/:id` | Get company by ID |
| PATCH | `/companies/:id` | Update company |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a user |
| GET | `/users` | List all users |
| PATCH | `/users/:id` | Update user |

### Company Access
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/companies/:id/users` | Add user to company |
| GET | `/companies/:id/users` | List company users |
| DELETE | `/companies/:id/users/:userId` | Remove user from company |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assets` | Create an asset |
| GET | `/assets` | List all assets |
| PATCH | `/assets/:id` | Update asset |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs?company_id=` | List audit logs by company |

## Setup

### Prerequisites
- Node.js 20+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### 1. Create D1 Database

```bash
# Create the database
wrangler d1 create asset-inventory-db

# Note the database_id and update wrangler.jsonc
```

### 2. Update Configuration

Edit `wrangler.jsonc` and replace `<YOUR_D1_DATABASE_ID>` with your actual database ID.

### 3. Run Migrations

```bash
# Local development
wrangler d1 execute asset-inventory-db --local --file=migrations/0001_initial_schema.sql

# Remote (production)
wrangler d1 execute asset-inventory-db --remote --file=migrations/0001_initial_schema.sql
```

### 4. Development

```bash
npm install
npm run dev
```

### 5. Deploy

```bash
npm run deploy
```

## Environment Variables (GitHub Secrets)

For CI/CD, set these secrets in your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers and D1 permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## Future Extensions

### Authentication (Planned)
- Headers `X-User-Id` and `X-Company-Id` are already parsed
- Add JWT validation middleware
- Integrate with Cloudflare Access or external IdP

### RBAC (Planned)
- Role field exists on `company_access` table
- Roles: `owner`, `admin`, `member`, `viewer`
- Add permission checks in route handlers

### Integrations (Planned)
- Webhook notifications on mutations
- Export to external systems
- Bulk import API

## Data Model

### Entity Relationships
```
companies (1) ←──────────────── (N) users (primary_company)
    │                                │
    │                                │
    └──── (N) company_access (N) ────┘
                  │
                  │
companies (1) ←── (N) assets
    │
    │
    └──── (N) audit_logs
```

### Status Values
- **Companies**: `active`, `inactive`, `suspended`
- **Users**: `active`, `inactive`, `suspended`
- **Assets**: `active`, `inactive`, `disposed`, `maintenance`
- **Roles**: `owner`, `admin`, `member`, `viewer`

## License

MIT