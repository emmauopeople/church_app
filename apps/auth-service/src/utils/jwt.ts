import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type JwtUserPayload = {
  userId: string;
  churchId: string;
  role: "ADMIN" | "USER";
};

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1h") as SignOptions["expiresIn"];

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export function signAccessToken(payload: JwtUserPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };

  return jwt.sign(payload, JWT_SECRET as Secret, options);
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET as Secret) as JwtUserPayload;
}
