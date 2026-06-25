import { ensureAuthTables } from "../config/bootstrap.js";
import { db } from "../config/db.js";

type AuditAction = "LOGIN" | "LOGOUT";
type AuditStatus = "SUCCESS" | "FAILED";

export type AuthAuditLog = {
  id: string;
  church_id: string | null;
  user_id: string | null;
  email_attempted: string | null;
  action: string;
  status: string;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
};

let tableReadyPromise: Promise<void> | null = null;

async function ensureReady() {
  tableReadyPromise ??= ensureAuthTables();
  await tableReadyPromise;
}

export async function createAuthAudit(params: {
  churchId?: string | null;
  userId?: string | null;
  email?: string | null;
  action: AuditAction | "USER_CREATED" | "USER_UPDATED" | "USER_ACTIVATED" | "USER_DEACTIVATED";
  status: AuditStatus;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await ensureReady();

  await db.query(
    `
      INSERT INTO auth_activity_logs (
        church_id,
        user_id,
        email_attempted,
        action,
        status,
        failure_reason,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      params.churchId ?? null,
      params.userId ?? null,
      params.email ?? null,
      params.action,
      params.status,
      params.reason ?? null,
      params.ipAddress ?? null,
      params.userAgent ?? null
    ]
  );
}

export async function listAuthAuditLogs(params: {
  churchId: string;
  limit?: number;
}): Promise<AuthAuditLog[]> {
  await ensureReady();

  const result = await db.query<AuthAuditLog>(
    `
      SELECT
        id::text,
        church_id::text,
        user_id::text,
        email_attempted,
        action,
        status,
        failure_reason,
        ip_address,
        user_agent,
        created_at
      FROM auth_activity_logs
      WHERE church_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [
      params.churchId,
      params.limit ?? 100
    ]
  );

  return result.rows;
}
