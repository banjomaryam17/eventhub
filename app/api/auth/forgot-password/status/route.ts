import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const result = await pool.query(
    `SELECT temp_password, status 
     FROM password_reset_requests 
     WHERE email = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  if (result.rows.length === 0 || result.rows[0].status !== "resolved") {
    return NextResponse.json({ temp_password: null });
  }

  return NextResponse.json({ temp_password: result.rows[0].temp_password });
}