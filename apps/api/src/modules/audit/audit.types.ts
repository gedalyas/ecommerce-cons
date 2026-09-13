import type { UserRole } from "@ecommerce/contracts/auth";

export type AuditDetail =
  | { action: "USER_REGISTERED"; email: string }
  | {
      action: "INVITATION_CREATED" | "INVITATION_RESENT" | "INVITATION_REVOKED";
      email: string;
      role: UserRole;
      storeName: string | null;
    }
  | { action: "CONSULTANTS_ASSIGNED"; names: string[] }
  | { action: "CONNECTION_REQUESTED"; connector: string }
  | { action: "CONNECTION_REQUEST_RESOLVED"; connector: string; status: string }
  | {
      action: "STORE_CREATED" | "STORE_UPDATED" | "STORE_ARCHIVED" | "STORE_RESTORED";
      storeName: string;
    }
  | { action: "IMPORT_RUN"; kind: string; fileName: string; imported: number; total: number }
  | { action: "IMPORT_UNDONE"; kind: string; fileName: string }
  | { action: "PILLAR_UPDATED"; pillar: string; status: string }
  | { action: "MANUAL_KPI_SET"; pillar: string; kpi: string; value: string }
  | {
      action:
        | "RECOMMENDATION_CREATED"
        | "RECOMMENDATION_UPDATED"
        | "RECOMMENDATION_DONE"
        | "RECOMMENDATION_REOPENED"
        | "RECOMMENDATION_DELETED";
      text: string;
    }
  | { action: "MILESTONE_UPDATED"; criterion: string; progress: number; achieved: boolean };
