import { db } from "../config/db.js";

export type AuthUser = {
  id: string;
  church_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  last_login_at: Date | null;
};

export type CreatedUser = {
  id: string;
  church_id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  created_at: Date;
};

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await db.query<AuthUser>(
    `
      SELECT
        id,
        church_id,
        full_name,
        email,
        password_hash,
        role,
        status,
        last_login_at
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

export async function createUser(params: {
  churchId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER";
}): Promise<CreatedUser> {
  const result = await db.query<CreatedUser>(
    `
      INSERT INTO users (
        church_id,
        full_name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, lower($3), $4, $5, 'ACTIVE')
      RETURNING
        id,
        church_id,
        full_name,
        email,
        role,
        status,
        created_at
    `,
    [
      params.churchId,
      params.fullName,
      params.email,
      params.passwordHash,
      params.role
    ]
  );

  return result.rows[0];
}

export async function updateLastLogin(userId: string): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [userId]
  );
}
