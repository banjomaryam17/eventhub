import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

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

    const { role } = await req.json();

    if (!role || !["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be user or admin" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, username, email, role, is_banned`,
      [role, targetUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: `User ${result.rows[0].username} role updated to ${role}`,
      user: result.rows[0],
    });
  } catch (err) {
    console.error("PUT /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}