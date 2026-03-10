
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface SessionPayload {
  userId: number;
  role: "user" | "admin";
  username: string;
}
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    // Token missing, expired, or tampered
    return null;
  }
}
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  if (session.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}