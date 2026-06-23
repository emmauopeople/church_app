import { db } from "../config/db.js";

type LoginStatus = "SUCCESS" | "FAILED";

export async function createLoginLog(params: {
  userId?: string | null;
  emailAttempted: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: LoginStatus;
  failureReason?: string | null;
}): Promise<void> {
  await db.query(
    `
      INSERT INTO login_logs (
        user_id,
        email_attempted,
        ip_address,
        user_agent,
        status,
        failure_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      params.userId ?? null,
      params.emailAttempted,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.status,
      params.failureReason ?? null
    ]
  );
}
