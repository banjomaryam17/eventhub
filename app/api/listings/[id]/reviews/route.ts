import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const listing_id = parseInt(id);
    if (isNaN(listing_id)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const { rating, content } = await req.json();

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const purchaseCheck = await pool.query(
      `SELECT 1
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.buyer_id = $1
         AND oi.listing_id = $2
         AND o.status = 'delivered'
       LIMIT 1`,
      [session.userId, listing_id]
    );

    if (purchaseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "You must purchase before reviewing" },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `INSERT INTO reviews (listing_id, user_id, rating, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [listing_id, session.userId, rating, content || null]
    );

    return NextResponse.json({ review: result.rows[0] });

  } catch (err) {
    if ((err as any).code === "23505") {
      return NextResponse.json(
        { error: "Already reviewed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}