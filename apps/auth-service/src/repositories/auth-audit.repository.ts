import { ensureAuthTables } from "../config/bootstrap.js";
import { db } from "../config/db.js";

type AuditAction = "LOGIN" | "LOGOUT";
type AuditStatus = "SUCCESS" | "FAILED";

let tableReadyPromise: Promise<void> | null = null;

async function ensureReady() {
  tableReadyPromise ??= ensureAuthTables();
  await tableReadyPromise;
}

export async function createAuthAudit(params: {
  churchId?: string | null;
  userId?: string | null;
  email?: string | null;
  action: AuditAction;
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
