import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { pool } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();

    const { userId, banned } = await req.json();

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: "Valid user ID is required" },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(userId);

    if (admin.userId === targetUserId && banned === true) {
      return NextResponse.json(
        { error: "You cannot ban your own account" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE users
       SET is_banned = $1
       WHERE id = $2
       RETURNING id, username, email, role, is_banned`,
      [Boolean(banned), targetUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: banned ? "User banned successfully" : "User unbanned successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}