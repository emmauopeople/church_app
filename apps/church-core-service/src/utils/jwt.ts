import jwt, { type Secret } from "jsonwebtoken";

export type JwtUserPayload = {
  userId: string;
  churchId: string;
  role: "ADMIN" | "USER";
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET as Secret) as JwtUserPayload;
}
