import type { UserRole, Permission, AuthenticatedUser } from './types';
import { DataClassification, canAccessClassification } from './data-classification';

// Define role hierarchy and default permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users.read', 'users.write', 'users.delete',
    'tickets.read', 'tickets.write', 'tickets.delete',
    'analytics.read', 'analytics.write',
    'ai.read', 'ai.write',
    'settings.read', 'settings.write',
    'audit.read',
    'org.read', 'org.write',
    'data.classify', 'data.declassify', 'data.access_restricted', 'data.access_confidential'
  ],
  org_admin: [
    'users.read', 'users.write', 'users.delete',
    'tickets.read', 'tickets.write',
    'analytics.read', 'analytics.write',
    'ai.read', 'ai.write',
    'settings.read', 'settings.write',
    'audit.read',
    'org.read',
    'data.classify', 'data.access_restricted', 'data.access_confidential'
  ],
  manager: [
    'users.read',
    'tickets.read', 'tickets.write',
    'analytics.read', 'analytics.write',
    'ai.read', 'ai.write',
    'settings.read',
    'data.access_confidential'
  ],
  agent: [
    'tickets.read', 'tickets.write',
    'analytics.read',
    'ai.read'
  ],
  readonly: [
    'tickets.read',
    'analytics.read'
  ]
};

// Role hierarchy (higher roles inherit permissions from lower roles)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  readonly: 1,
  agent: 2,
  manager: 3,
  org_admin: 4,
  super_admin: 5
};

/**
 * Get default permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AuthenticatedUser | null, permission: Permission): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  
  return user.permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthenticatedUser | null, permissions: Permission[]): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  
  return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthenticatedUser | null, permissions: Permission[]): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  
  return permissions.every(permission => user.permissions.includes(permission));
}

/**
 * Check if a user can manage another user (based on role hierarchy)
 */
export function canManageUser(manager: AuthenticatedUser | null, targetUser: AuthenticatedUser): boolean {
  if (!manager || !manager.isActive) {
    return false;
  }
  
  // Users can always manage themselves (for profile updates)
  if (manager.id === targetUser.id) {
    return true;
  }
  
  // Must be in the same organization (unless super admin)
  if (manager.role !== 'super_admin' && manager.organizationId !== targetUser.organizationId) {
    return false;
  }
  
  // Check role hierarchy
  const managerLevel = ROLE_HIERARCHY[manager.role];
  const targetLevel = ROLE_HIERARCHY[targetUser.role];
  
  return managerLevel > targetLevel;
}

/**
 * Check if a user has access to organization data
 */
export function hasOrganizationAccess(user: AuthenticatedUser | null, organizationId: string): boolean {
  if (!user || !user.isActive) {
    return false;
  }
  
  // Super admins have access to all organizations
  if (user.role === 'super_admin') {
    return true;
  }
  
  // Users can only access their own organization
  return user.organizationId === organizationId;
}

/**
 * Get user's effective permissions (role permissions + custom permissions)
 */
export function getEffectivePermissions(role: UserRole, customPermissions: Permission[] = []): Permission[] {
  const rolePermissions = getRolePermissions(role);
  const allPermissions = Array.from(new Set([...rolePermissions, ...customPermissions]));
  
  return allPermissions;
}

/**
 * Validate if permissions are valid for a role
 */
export function validatePermissionsForRole(role: UserRole, permissions: Permission[]): boolean {
  const allowedPermissions = getRolePermissions(role);
  return permissions.every(permission => allowedPermissions.includes(permission));
}

/**
 * Filter data based on user permissions and organization access
 */
export function filterByAccess<T extends { organizationId?: string }>(
  user: AuthenticatedUser | null,
  data: T[],
  requirePermission?: Permission
): T[] {
  if (!user || !user.isActive) {
    return [];
  }
  
  // Check required permission
  if (requirePermission && !hasPermission(user, requirePermission)) {
    return [];
  }
  
  // Super admins see everything
  if (user.role === 'super_admin') {
    return data;
  }
  
  // Filter by organization
  return data.filter(item => {
    if (!item.organizationId) {
      return false; // No organization data should be restricted
    }
    return item.organizationId === user.organizationId;
  });
}

/**
 * Create a permission check middleware function
 */
export function requirePermission(permission: Permission) {
  return (user: AuthenticatedUser | null): boolean => {
    return hasPermission(user, permission);
  };
}

/**
 * Create multiple permission check functions
 */
export function requirePermissions(permissions: Permission[], requireAll = true) {
  return (user: AuthenticatedUser | null): boolean => {
    return requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
  };
}

/**
 * Check if user can access data with specific classification
 */
export function hasDataClassificationAccess(
  user: AuthenticatedUser | null,
  classification: DataClassification,
  organizationId?: string
): boolean {
  return canAccessClassification(user, classification, organizationId);
}

/**
 * Check if user can classify data
 */
export function canClassifyData(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, 'data.classify');
}

/**
 * Check if user can declassify data
 */
export function canDeclassifyData(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, 'data.declassify');
}

/**
 * Check if user can access restricted data
 */
export function canAccessRestrictedData(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, 'data.access_restricted');
}

/**
 * Check if user can access confidential data
 */
export function canAccessConfidentialData(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, 'data.access_confidential');
}

/**
 * Filter data based on classification and user permissions
 */
export function filterByClassification<T extends { classification?: { level: DataClassification }; organizationId?: string }>(
  user: AuthenticatedUser | null,
  data: T[]
): T[] {
  if (!user || !user.isActive) {
    return [];
  }

  return data.filter(item => {
    // If no classification, default to INTERNAL level
    const classification = item.classification?.level || DataClassification.INTERNAL;
    return hasDataClassificationAccess(user, classification, item.organizationId);
  });
}

/**
 * Get maximum classification level a user can access
 */
export function getMaxAccessibleClassification(user: AuthenticatedUser | null): DataClassification {
  if (!user || !user.isActive) {
    return DataClassification.PUBLIC;
  }

  if (hasPermission(user, 'data.access_restricted')) {
    return DataClassification.RESTRICTED;
  }
  
  if (hasPermission(user, 'data.access_confidential')) {
    return DataClassification.CONFIDENTIAL;
  }
  
  if (hasPermission(user, 'tickets.read')) {
    return DataClassification.INTERNAL;
  }
  
  return DataClassification.PUBLIC;
}

/**
 * Validate user access to specific classified data
 */
export function validateClassifiedDataAccess(
  user: AuthenticatedUser | null,
  classification: DataClassification,
  organizationId?: string,
  requiredPermissions?: Permission[]
): {
  allowed: boolean;
  reason?: string;
  requiredTraining?: string[];
} {
  if (!user || !user.isActive) {
    return {
      allowed: false,
      reason: 'User not authenticated or inactive'
    };
  }

  // Check classification access
  if (!hasDataClassificationAccess(user, classification, organizationId)) {
    return {
      allowed: false,
      reason: `Insufficient permissions for ${classification} data`
    };
  }

  // Check additional permissions if required
  if (requiredPermissions && !hasAllPermissions(user, requiredPermissions)) {
    return {
      allowed: false,
      reason: `Missing required permissions: ${requiredPermissions.join(', ')}`
    };
  }

  // Check organization access
  if (organizationId && !hasOrganizationAccess(user, organizationId)) {
    return {
      allowed: false,
      reason: 'Access denied: different organization'
    };
  }

  // Check for training requirements (placeholder for future implementation)
  const requiredTraining: string[] = [];
  if (classification === DataClassification.RESTRICTED) {
    requiredTraining.push('PII Handling Training');
  }

  return {
    allowed: true,
    requiredTraining: requiredTraining.length > 0 ? requiredTraining : undefined
  };
}