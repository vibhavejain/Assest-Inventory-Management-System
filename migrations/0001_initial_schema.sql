-- Asset Inventory Management System - Initial Schema
-- Version: 1.0.0
-- Database: Cloudflare D1 (SQLite-compatible)

-- Enable foreign key enforcement
PRAGMA foreign_keys = ON;

-- ============================================================================
-- COMPANIES TABLE
-- Represents tenants in the multi-tenant system
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE COLLATE NOCASE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_name ON companies(name COLLATE NOCASE);

-- ============================================================================
-- USERS TABLE
-- System users who can belong to multiple companies
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    primary_company_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (primary_company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_primary_company ON users(primary_company_id);

-- ============================================================================
-- COMPANY_ACCESS TABLE
-- Junction table for user-company relationships with roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_access (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_company_access_user ON company_access(user_id);
CREATE INDEX idx_company_access_company ON company_access(company_id);
CREATE INDEX idx_company_access_role ON company_access(role);

-- ============================================================================
-- ASSETS TABLE
-- Hardware, software, licenses, and other trackable assets
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hardware', 'software', 'license', 'other')),
    name TEXT NOT NULL,
    identifier TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disposed', 'maintenance')),
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_assets_company ON assets(company_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_identifier ON assets(identifier);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- Immutable audit trail for all mutations - NEVER DELETE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    user_id TEXT,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'user', 'company_access', 'asset')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    changes TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
