import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "super-secret-admin-key-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: AdminUser): Promise<string> {
  return new SignJWT({ 
    id: user.id, 
    email: user.email,
    name: user.name 
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string | null,
    };
  } catch {
    return null;
  }
}
