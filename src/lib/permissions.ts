export type UserRole = 
  | "call_center_agent"
  | "sales_agent_licensed"
  | "sales_agent_unlicensed"
  | "sales_manager"
  | "call_center_manager"
  | "system_admin";

export type Permission = 
  | "submit_leads"
  | "view_own_leads"
  | "view_center_leads"
  | "view_assigned_leads"
  | "view_all_leads"
  | "view_all_team_leads"
  | "edit_own_leads"
  | "edit_assigned_leads"
  | "edit_all_leads"
  | "delete_leads"
  | "assign_leads"
  | "reassign_leads"
  | "update_lead_status"
  | "update_pipeline_stage"
  | "add_notes"
  | "view_call_recordings"
  | "add_call_recordings"
  | "make_outbound_calls"
  | "convert_leads_to_customers"
  | "close_deals"
  | "view_own_performance"
  | "view_team_performance"
  | "view_center_performance"
  | "view_all_performance"
  | "access_pipeline_readonly"
  | "access_pipeline_full"
  | "manage_pipeline_stages"
  | "manage_users"
  | "manage_roles"
  | "manage_call_center_agents"
  | "configure_pipelines"
  | "configure_stages"
  | "set_up_carrier_integrations"
  | "configure_routing_rules"
  | "manage_carrier_update_mappings"
  | "access_all_system_data"
  | "generate_reports"
  | "override_lead_assignments";

export interface RolePermissions {
  role: UserRole;
  accessLevel: "Limited" | "Limited Sales" | "Medium" | "High" | "Full";
  permissions: Permission[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  call_center_agent: {
    role: "call_center_agent",
    accessLevel: "Limited",
    permissions: [
      "submit_leads",
      "view_own_leads",
      "view_center_leads",
      "access_pipeline_readonly",
      "view_call_recordings"
    ],
  },
  sales_agent_licensed: {
    role: "sales_agent_licensed",
    accessLevel: "Medium",
    permissions: [
      "view_all_leads",
      "update_lead_status",
      "access_pipeline_readonly",
      "add_notes",
      "add_call_recordings",
      "make_outbound_calls",
      "close_deals",
      "view_own_performance",
    ],
  },
  sales_agent_unlicensed: {
    role: "sales_agent_unlicensed",
    accessLevel: "Limited Sales",
    permissions: [
      "view_all_leads",
      "add_notes",
      "update_lead_status",
    ],
  },
  sales_manager: {
    role: "sales_manager",
    accessLevel: "High",
    permissions: [
      "view_all_leads",
      "assign_leads",
      "reassign_leads",
      "manage_pipeline_stages",
      "view_team_performance",
      "view_call_recordings",
      "override_lead_assignments",
      "generate_reports",
      "update_pipeline_stage",
      "add_notes",
      "access_pipeline_full",
      "convert_leads_to_customers",
    ],
  },
  call_center_manager: {
    role: "call_center_manager",
    accessLevel: "Medium",
    permissions: [
      "view_center_leads",
      "manage_call_center_agents",
      "view_center_performance",
      "access_pipeline_readonly"
    ],
  },
  system_admin: {
    role: "system_admin",
    accessLevel: "Full",
    permissions: [
      "manage_users",
      "manage_roles",
      "configure_pipelines",
      "configure_stages",
      "set_up_carrier_integrations",
      "configure_routing_rules",
      "manage_carrier_update_mappings",
      "access_all_system_data",
      "view_all_leads",
      "edit_all_leads",
      "delete_leads",
      "assign_leads",
      "reassign_leads",
      "manage_pipeline_stages",
      "generate_reports",
      "override_lead_assignments",
      "access_pipeline_full",
      "view_all_performance",
      "view_team_performance",
      "view_center_performance",
      "view_own_performance",
      "convert_leads_to_customers",
      "close_deals",
      "update_pipeline_stage",
      "add_notes",
      "view_call_recordings",
      "add_call_recordings",
      "make_outbound_calls",
    ],
  },
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  return ROLE_PERMISSIONS[role].permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  return permissions.some(permission => ROLE_PERMISSIONS[role].permissions.includes(permission));
}

export function hasAllPermissions(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  return permissions.every(permission => ROLE_PERMISSIONS[role].permissions.includes(permission));
}

export function getRolePermissions(role: UserRole | null | undefined): Permission[] {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return [];
  }
  return ROLE_PERMISSIONS[role].permissions;
}

export function getAccessLevel(role: UserRole | null | undefined): string {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return "None";
  }
  return ROLE_PERMISSIONS[role].accessLevel;
}

export function getLeadsViewFilter(role: UserRole | null | undefined, userId: string | null): {
  filterBy: "assigned_agent_id" | "call_center_id" | "user_id" | "all" | null;
  value: string | null;
} {
  if (!role || !userId) {
    return { filterBy: null, value: null };
  }

  switch (role) {
    case "call_center_agent":
      return { filterBy: "assigned_agent_id", value: userId };
    
    case "sales_agent_licensed":
    case "sales_agent_unlicensed":
    case "sales_manager":
      return { filterBy: "all", value: null };
    
    case "call_center_manager":
      return { filterBy: "call_center_id", value: null };
    
    case "system_admin":
      return { filterBy: "all", value: null };
    
    default:
      return { filterBy: null, value: null };
  }
}

export function canEditLead(
  role: UserRole | null | undefined,
  userId: string | null,
  lead: { assigned_agent_id?: string | null; user_id?: string | null; call_center_id?: string | null } | null,
  userCallCenterId?: string | null
): boolean {
  if (!role || !userId || !lead) {
    return false;
  }

  switch (role) {
    case "call_center_agent":
      return lead.assigned_agent_id === userId;
    
    case "sales_agent_licensed":
    case "sales_agent_unlicensed":
    case "sales_manager":
      return false;
    
    case "call_center_manager":
    case "system_admin":
      return hasPermission(role, "edit_all_leads");
    
    default:
      return false;
  }
}

export function canCreateLead(role: UserRole | null | undefined): boolean {
  if (!role) {
    return false;
  }
  return role === "call_center_agent" || hasPermission(role, "access_all_system_data");
}

export function canDeleteLead(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "delete_leads");
}

export function canAssignLeads(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "assign_leads") || hasPermission(role, "reassign_leads");
}

export function canDragDropInPipeline(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "access_pipeline_full") || hasPermission(role, "update_pipeline_stage");
}

export function isPipelineReadOnly(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "access_pipeline_readonly") && !canDragDropInPipeline(role);
}

export function canManagePipelineStages(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "manage_pipeline_stages");
}

export function canSeeAssignmentSection(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "assign_leads") || hasPermission(role, "reassign_leads");
}

export function getRolesWithAccess(permission: Permission): UserRole[] {
  return Object.values(ROLE_PERMISSIONS)
    .filter(rp => rp.permissions.includes(permission))
    .map(rp => rp.role);
}

export function isValidRole(role: string | null | undefined): role is UserRole {
  return role !== null && role !== undefined && role in ROLE_PERMISSIONS;
}

