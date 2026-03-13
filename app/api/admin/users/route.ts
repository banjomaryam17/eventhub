import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    // Check login
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check admin
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    // Query users
    const result = await pool.query(`
      SELECT 
        id,
        email,
        username,
        role,
        is_verified,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      users: result.rows,
    });

  } catch (error) {
    console.error("Admin users fetch error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}