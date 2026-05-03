import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userResult = await pool.query(
      `SELECT id, username, email FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    // Always return success even if user not found
    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: "Request submitted" });
    }

    const user = userResult.rows[0];

    // Checks if no pending request already exists
    const existing = await pool.query(
      `SELECT id FROM password_reset_requests 
       WHERE user_id = $1 AND status = 'pending'`,
      [user.id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: "Request submitted" });
    }

    await pool.query(
      `INSERT INTO password_reset_requests (user_id, username, email)
       VALUES ($1, $2, $3)`,
      [user.id, user.username, user.email]
    );

    return NextResponse.json({ message: "Request submitted" });
  } catch (err) {
    console.error("POST /api/auth/forgot-password error:", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}