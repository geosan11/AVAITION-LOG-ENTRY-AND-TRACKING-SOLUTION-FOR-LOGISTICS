export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'station_manager'
  | 'desk_officer'
  | 'ramp_agent'
  | 'accountant';

export type Permission =
  // Waybill operations
  | 'awb:create'
  | 'awb:view'
  | 'awb:void'
  | 'awb:edit_after_issue'
  // Manifest & flight operations
  | 'manifest:create'
  | 'manifest:lock'
  | 'manifest:dispatch'
  // Cargo status transitions
  | 'cargo:screen'
  | 'cargo:manifest'
  | 'cargo:depart'
  | 'cargo:arrive'
  | 'cargo:deliver'
  // Financial
  | 'finance:view'
  | 'finance:edit_payment'
  | 'finance:eod_settlement'
  | 'finance:view_pl'
  // Rate card management
  | 'rates:view'
  | 'rates:edit'
  // Staff & hub management
  | 'staff:invite'
  | 'staff:deactivate'
  | 'hub:create'
  | 'hub:edit'
  // Billing & subscription
  | 'billing:view'
  | 'billing:manage'
  // Corporate client ledger
  | 'clients:view'
  | 'clients:edit'
  // System
  | 'settings:view'
  | 'settings:edit';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'awb:create', 'awb:view', 'awb:void', 'awb:edit_after_issue',
    'manifest:create', 'manifest:lock', 'manifest:dispatch',
    'cargo:screen', 'cargo:manifest', 'cargo:depart', 'cargo:arrive', 'cargo:deliver',
    'finance:view', 'finance:edit_payment', 'finance:eod_settlement', 'finance:view_pl',
    'rates:view', 'rates:edit',
    'staff:invite', 'staff:deactivate', 'hub:create', 'hub:edit',
    'billing:view', 'billing:manage',
    'clients:view', 'clients:edit',
    'settings:view', 'settings:edit',
  ],

  tenant_admin: [
    'awb:create', 'awb:view', 'awb:void', 'awb:edit_after_issue',
    'manifest:create', 'manifest:lock', 'manifest:dispatch',
    'cargo:screen', 'cargo:manifest', 'cargo:depart', 'cargo:arrive', 'cargo:deliver',
    'finance:view', 'finance:edit_payment', 'finance:eod_settlement', 'finance:view_pl',
    'rates:view', 'rates:edit',
    'staff:invite', 'staff:deactivate', 'hub:create', 'hub:edit',
    'billing:view', 'billing:manage',
    'clients:view', 'clients:edit',
    'settings:view', 'settings:edit',
  ],

  station_manager: [
    'awb:create', 'awb:view', 'awb:void',
    'manifest:create', 'manifest:lock', 'manifest:dispatch',
    'cargo:screen', 'cargo:manifest', 'cargo:depart', 'cargo:arrive', 'cargo:deliver',
    'finance:view', 'finance:edit_payment', 'finance:eod_settlement',
    'rates:view', 'rates:edit',
    'clients:view', 'clients:edit',
    'settings:view',
  ],

  desk_officer: [
    'awb:create', 'awb:view',
    'cargo:screen',
    'finance:view',
    'rates:view',
  ],

  ramp_agent: [
    'awb:view',
    'cargo:screen', 'cargo:manifest', 'cargo:depart', 'cargo:arrive', 'cargo:deliver',
  ],

  accountant: [
    'awb:view',
    'finance:view', 'finance:edit_payment', 'finance:eod_settlement', 'finance:view_pl',
    'clients:view',
    'billing:view',
  ],
};

/** Check if a role has a specific permission */
export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Check if a role has ALL of the listed permissions */
export function canAll(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/** Check if a role has ANY of the listed permissions */
export function canAny(role: UserRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** React hook: returns a bound `can` function for the current user's role */
export function usePermissions(role: UserRole | undefined | null) {
  return {
    can: (permission: Permission) => can(role, permission),
    canAll: (permissions: Permission[]) => canAll(role, permissions),
    canAny: (permissions: Permission[]) => canAny(role, permissions),
    role,
  };
}
