import { createContext, useContext, useState, ReactNode } from 'react';
import type { AccessRole } from '../types';

// ============================================================================
// Role-Based Access Control (RBAC) System
// ============================================================================
// 
// Roles (scoped per company):
// - OWNER: Full access, company creator, immutable top authority
// - ADMIN: Trusted operators, manage assets/users (except OWNER)
// - MEMBER: Regular employees, view assigned assets
// - READ_ONLY: Auditors/reviewers, zero write access
// ============================================================================

// Permission definitions per role
export const ROLE_PERMISSIONS = {
  OWNER: {
    // Company
    canDeleteCompany: true,
    canTransferOwnership: true,
    canEnableDisableCompany: true,
    canModifyCompanyConfig: true,
    // Users
    canManageUsers: true,
    canManageRoles: true,
    canRemoveAnyUser: true,
    // Assets
    canCreateAssets: true,
    canUpdateAssets: true,
    canDeleteAssets: true,
    canViewAssets: true,
    canAssignAssets: true,
    // Audit
    canViewAuditLogs: true,
  },
  ADMIN: {
    // Company
    canDeleteCompany: false,
    canTransferOwnership: false,
    canEnableDisableCompany: false,
    canModifyCompanyConfig: true,
    // Users
    canManageUsers: true,
    canManageRoles: true,
    canRemoveAnyUser: false, // Cannot remove OWNER
    // Assets
    canCreateAssets: true,
    canUpdateAssets: true,
    canDeleteAssets: true,
    canViewAssets: true,
    canAssignAssets: true,
    // Audit
    canViewAuditLogs: true,
  },
  MEMBER: {
    // Company
    canDeleteCompany: false,
    canTransferOwnership: false,
    canEnableDisableCompany: false,
    canModifyCompanyConfig: false,
    // Users
    canManageUsers: false,
    canManageRoles: false,
    canRemoveAnyUser: false,
    // Assets
    canCreateAssets: false,
    canUpdateAssets: false,
    canDeleteAssets: false,
    canViewAssets: true, // Read-only or scoped
    canAssignAssets: false,
    // Audit
    canViewAuditLogs: false,
  },
  READ_ONLY: {
    // Company
    canDeleteCompany: false,
    canTransferOwnership: false,
    canEnableDisableCompany: false,
    canModifyCompanyConfig: false,
    // Users
    canManageUsers: false,
    canManageRoles: false,
    canRemoveAnyUser: false,
    // Assets
    canCreateAssets: false,
    canUpdateAssets: false,
    canDeleteAssets: false,
    canViewAssets: true,
    canAssignAssets: false,
    // Audit
    canViewAuditLogs: true, // Read-only access
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.OWNER;

// Helper to check if a role has a specific permission
export function hasPermission(role: AccessRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// Helper to check if a role can manage another role
export function canManageRole(actorRole: AccessRole, targetRole: AccessRole): boolean {
  const roleHierarchy: Record<AccessRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    READ_ONLY: 1,
  };
  
  // OWNER can manage anyone except other OWNERs
  if (actorRole === 'OWNER') {
    return targetRole !== 'OWNER';
  }
  
  // ADMIN can manage MEMBER and READ_ONLY only
  if (actorRole === 'ADMIN') {
    return roleHierarchy[targetRole] < roleHierarchy.ADMIN;
  }
  
  // MEMBER and READ_ONLY cannot manage anyone
  return false;
}

// Auth context for current user
interface AuthContextType {
  currentUserRole: AccessRole | null;
  currentCompanyId: string | null;
  setCurrentUserRole: (role: AccessRole | null) => void;
  setCurrentCompanyId: (companyId: string | null) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // For now, default to OWNER for demo purposes
  // In production, this would come from authentication
  const [currentUserRole, setCurrentUserRole] = useState<AccessRole | null>('OWNER');
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  const can = (permission: Permission): boolean => {
    if (!currentUserRole) return false;
    return hasPermission(currentUserRole, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUserRole,
        currentCompanyId,
        setCurrentUserRole,
        setCurrentCompanyId,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
