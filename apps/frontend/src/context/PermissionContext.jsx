import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext({
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isAdmin: false,
});

/**
 * Evaluates whether granted permissions satisfy the required permission key.
 * Supports wildcard '*' and namespace wildcard 'prefix:*'
 */
export const checkPermission = (userPermissions = [], required) => {
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) {
    return false;
  }
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(required)) return true;

  const parts = required.split(':');
  if (parts.length > 1) {
    if (userPermissions.includes(`${parts[0]}:*`)) return true;
  }
  return false;
};

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    return user?.permissions || [];
  }, [user?.permissions]);

  const isAdmin = useMemo(() => {
    return user?.role === 'ADMIN' || permissions.includes('*');
  }, [user?.role, permissions]);

  const hasPermission = (permission) => {
    if (isAdmin) return true;
    return checkPermission(permissions, permission);
  };

  const hasAnyPermission = (requiredList = []) => {
    if (isAdmin) return true;
    return requiredList.some(p => checkPermission(permissions, p));
  };

  const hasAllPermissions = (requiredList = []) => {
    if (isAdmin) return true;
    return requiredList.every(p => checkPermission(permissions, p));
  };

  return (
    <PermissionContext.Provider value={{
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAdmin,
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => useContext(PermissionContext);

/**
 * Declarative component gate for rendering UI based on RBAC permissions.
 * Usage:
 * <Can perform="users:create" fallback={<span className="text-slate-400">Restricted</span>}>
 *   <button>Create User</button>
 * </Can>
 */
export const Can = ({ perform, performAny, children, fallback = null }) => {
  const { hasPermission, hasAnyPermission } = usePermission();
  
  let allowed = false;
  if (perform) {
    allowed = hasPermission(perform);
  } else if (performAny) {
    allowed = hasAnyPermission(performAny);
  }

  return allowed ? <>{children}</> : fallback;
};
