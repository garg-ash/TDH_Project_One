import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface TablePermission {
  can_view: boolean;
  can_edit: boolean;
  source: 'explicit_permission' | 'role_default';
}

interface UseTablePermissionsReturn {
  canEdit: (tableName: string) => boolean;
  canView: (tableName: string) => boolean;
  checkPermission: (tableName: string) => Promise<TablePermission | null>;
  loading: boolean;
  error: string | null;
}

export const useTablePermissions = (): UseTablePermissionsReturn => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Map<string, TablePermission>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async (tableName: string): Promise<TablePermission | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.checkTablePermission(tableName);
      
      if (response.success && response.data) {
        const permission: TablePermission = {
          can_view: response.data.can_view,
          can_edit: response.data.can_edit,
          source: response.data.source as 'explicit_permission' | 'role_default'
        };
        
        setPermissions(prev => new Map(prev).set(tableName, permission));
        return permission;
      }
      
      return null;
    } catch (err) {
      console.error(`Error checking permission for table ${tableName}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      
      // Fallback to role-based permissions
      const fallbackPermission = getRoleBasedPermission(tableName);
      setPermissions(prev => new Map(prev).set(tableName, fallbackPermission));
      return fallbackPermission;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getRoleBasedPermission = (tableName: string): TablePermission => {
    if (!user) {
      return { can_view: false, can_edit: false, source: 'role_default' };
    }

    let canEdit = false;
    
    if (user.role === 'super_admin') {
      canEdit = true;
    } else if (user.role === 'admin' && tableName !== 'import_sessions') {
      canEdit = true;
    }
    
    return {
      can_view: true,
      can_edit: canEdit,
      source: 'role_default'
    };
  };

  const canEdit = useCallback((tableName: string): boolean => {
    const permission = permissions.get(tableName);
    if (permission) {
      return permission.can_edit;
    }
    
    // Fallback to role-based permission
    const roleBasedPermission = getRoleBasedPermission(tableName);
    return roleBasedPermission.can_edit;
  }, [permissions, user]);

  const canView = useCallback((tableName: string): boolean => {
    const permission = permissions.get(tableName);
    if (permission) {
      return permission.can_view;
    }
    
    // Fallback to role-based permission
    const roleBasedPermission = getRoleBasedPermission(tableName);
    return roleBasedPermission.can_view;
  }, [permissions, user]);

  // Pre-load permissions for common tables when user changes
  useEffect(() => {
    if (user) {
      const commonTables = ['voters', 'surnames', 'division_data', 'village_mapping', 'import_sessions'];
      commonTables.forEach(table => {
        checkPermission(table);
      });
    }
  }, [user, checkPermission]);

  return {
    canEdit,
    canView,
    checkPermission,
    loading,
    error
  };
};
