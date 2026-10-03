import type { UserRole } from "@ecommerce/contracts/auth";

export type AuditDetail =
  | { action: "USER_REGISTERED"; email: string }
  | { action: "USER_IMPERSONATED"; name: string; email: string }
  | {
      action: "INVITATION_CREATED" | "INVITATION_RESENT" | "INVITATION_REVOKED";
      email: string;
      role: UserRole;
      storeName: string | null;
    }
  | { action: "CONSULTANTS_ASSIGNED"; names: string[] }
  | { action: "STORE_SCREENS_RELEASED"; screens: string[] }
  | { action: "TEAM_MEMBER_INVITED" | "TEAM_INVITATION_REVOKED"; email: string; areas: string[] }
  | { action: "TEAM_MEMBER_UPDATED"; name: string; areas: string[] }
  | { action: "TEAM_MEMBER_REMOVED"; name: string }
  | {
      action: "CAMPAIGN_TAGGED";
      campaign: string;
      platform: string;
      stage: string;
      channel: string;
    }
  | { action: "CONNECTION_REQUESTED"; connector: string }
  | { action: "CONNECTION_REQUEST_RESOLVED"; connector: string; status: string }
  | {
      action: "STORE_CREATED" | "STORE_UPDATED" | "STORE_ARCHIVED" | "STORE_RESTORED";
      storeName: string;
    }
  | { action: "IMPORT_RUN"; kind: string; fileName: string; imported: number; total: number }
  | { action: "IMPORT_UNDONE"; kind: string; fileName: string }
  | { action: "IMPORT_MAPPING_SUGGESTED"; kind: string; fileName: string; fields: number }
  | { action: "ASSISTANT_ASKED"; consulted: string[] }
  | {
      action: "REPORT_SCHEDULE_CREATED" | "REPORT_SCHEDULE_UPDATED" | "REPORT_SCHEDULE_DELETED";
      name: string;
    }
  | { action: "REPORT_SENT"; name: string; recipients: number }
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
  | { action: "MILESTONE_UPDATED"; criterion: string; progress: number; achieved: boolean }
  | {
      action: "SUBSCRIPTION_ACTIVATED" | "SUBSCRIPTION_PAST_DUE" | "SUBSCRIPTION_CANCELED";
      email: string;
      plan: string | null;
    }
  | { action: "ACCESS_GRANTED" | "ACCESS_REVOKED"; storeName: string }
  | {
      action: "CONTRACT_CREATED" | "CONTRACT_SIGNED" | "CONTRACT_REFUSED" | "CONTRACT_RESENT";
      signerEmail: string;
    }
  | { action: "CONNECTION_AUTHORIZED" | "CONNECTION_REMOVED"; connector: string; account: string }
  | { action: "CONNECTION_SYNCED"; connector: string; rows: number }
  | { action: "CONNECTION_FAILED"; connector: string; message: string }
  | { action: "CONNECTION_TESTED"; connector: string; result: string }
  | { action: "DATA_SOURCE_CHANGED"; kind: string; source: string | null; since: string | null };
