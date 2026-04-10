import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // User basic info
    const userResult = await pool.query(
      `SELECT id, username FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reputation
    const repResult = await pool.query(
      `SELECT reputation_score, total_sales, is_verified_seller
       FROM user_reputation
       WHERE user_id = $1`,
      [userId]
    );

    // Listings
    const listingsResult = await pool.query(
      `SELECT id, title, price
       FROM listings
       WHERE seller_id = $1 AND is_active = TRUE`,
      [userId]
    );

    return NextResponse.json({
      user: {
        ...userResult.rows[0],
        ...(repResult.rows[0] || {
          reputation_score: 0,
          total_sales: 0,
          is_verified_seller: false,
        }),
        listings: listingsResult.rows,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }

  async function PUT(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Auth" }, { status: 401 });
  
    const { name, dob } = await req.json();
  
    await pool.query(
      `UPDATE users SET name = $1, dob = $2 WHERE id = $3`,
      [name, dob, session.userId]
    );
  
    return NextResponse.json({ message: "Updated" });
  }
  
}