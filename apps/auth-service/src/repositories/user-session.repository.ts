import { db } from "../config/db.js";

export type AuthSessionUser = {
  id: string;
  church_id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
};

export async function findSessionUserById(userId: string): Promise<AuthSessionUser | null> {
  const result = await db.query<AuthSessionUser>(
    `
      SELECT
        id,
        church_id,
        full_name,
        email,
        role,
        status
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}
