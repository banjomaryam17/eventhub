import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const userResult = await pool.query(
    `SELECT id, username, role, is_banned
     FROM users
     WHERE id = $1`,
    [session.userId]
  );

  if (userResult.rows.length === 0) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const user = userResult.rows[0];

  if (user.is_banned) {
    return NextResponse.json(
      { error: "Your account has been banned" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    user: {
      userId: user.id,
      username: user.username,
      role: user.role,
      is_banned: user.is_banned,
    },
  });
}