import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const userId = formData.get("userId");
    const role = formData.get("role");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role`,
      [role, userId]
    );

    return NextResponse.json({ user: result.rows[0] });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}