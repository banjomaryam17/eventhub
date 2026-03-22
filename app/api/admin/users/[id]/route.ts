import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const p = await params;
    const targetUserId = parseInt(p.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (targetUserId === session.userId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { role } = body;

    const validRoles = ["user", "admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be user or admin" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      "SELECT id, username FROM users WHERE id = $1",
      [targetUserId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role",
      [role, targetUserId]
    );

    return NextResponse.json({
      message: `User ${result.rows[0].username} role updated to ${role}`,
      user: result.rows[0],
    });

  } catch (err) {
    console.error("PUT /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}