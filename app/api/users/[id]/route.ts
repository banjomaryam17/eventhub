import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

function getTrustTier(score: number) {
  if (score >= 90) return "Trusted";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

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

    // Basic user info
    const userResult = await pool.query(
      `SELECT id, username
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // - total_sales = delivered orders containing this seller's items
    const sellerStatsResult = await pool.query(
      `SELECT
         COALESCE(ROUND(AVG(r.rating) * 20), 100) AS seller_score,
         COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN oi.order_id END) AS total_sales
       FROM listings l
       LEFT JOIN reviews r
         ON r.listing_id = l.id
       LEFT JOIN order_items oi
         ON oi.listing_id = l.id
       LEFT JOIN orders o
         ON o.id = oi.order_id
       WHERE l.seller_id = $1`,
      [userId]
    );

    const sellerScore = parseInt(sellerStatsResult.rows[0]?.seller_score ?? "100");
    const totalSales = parseInt(sellerStatsResult.rows[0]?.total_sales ?? "0");
    const isVerifiedSeller = sellerScore >= 85 && totalSales >= 20;

    // Buyer stats:
    // - buyer_score = delivered / closed orders * 100
    // - closed orders = delivered + cancelled + refunded
    const buyerStatsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
         COUNT(*) FILTER (WHERE status IN ('delivered', 'cancelled', 'refunded')) AS closed_orders
       FROM orders
       WHERE buyer_id = $1`,
      [userId]
    );

    const deliveredOrders = parseInt(buyerStatsResult.rows[0]?.delivered_orders ?? "0");
    const closedOrders = parseInt(buyerStatsResult.rows[0]?.closed_orders ?? "0");

    const buyerScore =
      closedOrders === 0 ? 100 : Math.round((deliveredOrders / closedOrders) * 100);

    // Active listings
    const listingsResult = await pool.query(
      `SELECT id, title, price
       FROM listings
       WHERE seller_id = $1 AND is_active = TRUE`,
      [userId]
    );

    return NextResponse.json({
      user: {
        ...userResult.rows[0],
        seller_reputation: {
          score: sellerScore,
          total_sales: totalSales,
          is_verified_seller: isVerifiedSeller,
          tier: getTrustTier(sellerScore),
        },
        buyer_reputation: {
          score: buyerScore,
          total_purchases: deliveredOrders,
          tier: getTrustTier(buyerScore),
        },
        listings: listingsResult.rows,
      },
    });
  } catch (err) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, dob } = await req.json();

    await pool.query(
      `INSERT INTO user_profiles (user_id, name, dob)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         dob = EXCLUDED.dob,
         updated_at = CURRENT_TIMESTAMP`,
      [session.userId, name ?? null, dob ?? null]
    );

    return NextResponse.json({ message: "Profile updated" });
  } catch (err) {
    console.error("PUT /api/users/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}