import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.role,
        u.is_banned,
        u.created_at,
        COUNT(DISTINCT l.id) AS listing_count,
        COUNT(DISTINCT o.id) AS order_count
      FROM users u
      LEFT JOIN listings l ON l.seller_id = u.id
      LEFT JOIN orders o ON o.buyer_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}