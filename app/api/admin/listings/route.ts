import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT
        listings.id,
        listings.title,
        listings.price,
        listings.quantity,
        listings.is_active,
        listings.created_at,
        users.username AS seller
      FROM listings
      JOIN users ON listings.seller_id = users.id
      ORDER BY listings.created_at DESC
    `);

    return NextResponse.json({
      listings: result.rows,
    });

  } catch (error) {
    console.error("Admin listings error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
