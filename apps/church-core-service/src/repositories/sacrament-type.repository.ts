import { db } from "../config/db.js";

export type SacramentType = {
  id: number;
  code: string;
  name: string;
};

export async function listSacramentTypes(): Promise<SacramentType[]> {
  const result = await db.query<SacramentType>(
    `
      SELECT id, code, name
      FROM sacrament_types
      ORDER BY id ASC
    `
  );

  return result.rows;
}
