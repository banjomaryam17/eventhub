import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT * FROM password_reset_requests 
       WHERE status = 'pending'
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ requests: result.rows });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { request_id, user_id } = await req.json();

    // Generate temp password
    const tempPassword = "Haul" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const hashed = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hashed, user_id]
    );

    // Mark request as resolved
    await pool.query(
      `UPDATE password_reset_requests 
       SET status = 'resolved', temp_password = $1, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [tempPassword, request_id]
    );

    return NextResponse.json({ temp_password: tempPassword });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}