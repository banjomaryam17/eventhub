import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search    = searchParams.get("search")?.trim() ?? "";
    const category  = searchParams.get("category")?.trim() ?? "";
    const condition = searchParams.get("condition")?.trim() ?? "";
    const minPrice  = parseFloat(searchParams.get("minPrice") ?? "0");
    const maxPrice  = parseFloat(searchParams.get("maxPrice") ?? "999999");
    const sortBy    = searchParams.get("sortBy") ?? "newest";
    const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit     = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24")));
    const offset    = (page - 1) * limit;

    const validConditions = ["new", "used", "refurbished"];
    if (condition && !validConditions.includes(condition)) {
      return NextResponse.json(
        { error: "Invalid condition. Must be new, used, or refurbished." },
        { status: 400 }
      );
    }

    
    const validSorts: Record<string, string> = {
      newest:       "l.created_at DESC",
      oldest:       "l.created_at ASC",
      price_asc:    "l.price ASC",
      price_desc:   "l.price DESC",
      top_rated:    "l.average_rating DESC",
      most_reviews: "l.review_count DESC",
    };
    const orderBy = validSorts[sortBy] ?? validSorts.newest;

    const conditions: string[] = [
      "l.is_active = TRUE",
      "l.price >= $1",
      "l.price <= $2",
    ];
    const values: (string | number)[] = [minPrice, maxPrice];
    let paramIndex = 3;

    if (search) {
      conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`c.slug = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (condition) {
      conditions.push(`l.condition = $${paramIndex}`);
      values.push(condition);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // ── Main query
    // Gets listings with seller info, category, and primary image
    // is_anonymous hides the seller's name if they toggled it on
    const query = `
      SELECT
        l.id,
        l.title,
        l.description,
        l.price,
        l.quantity,
        l.condition,
        l.is_anonymous,
        l.average_rating,
        l.review_count,
        l.created_at,
        c.id         AS category_id,
        c.name       AS category_name,
        c.slug       AS category_slug,
        -- Hide seller identity if anonymous
        CASE WHEN l.is_anonymous THEN NULL ELSE u.id   END AS seller_id,
        CASE WHEN l.is_anonymous THEN 'Anonymous'      
             ELSE u.username END                           AS seller_username,
        CASE WHEN l.is_anonymous THEN NULL
             ELSE ur.is_verified_seller END                AS seller_is_verified,
        CASE WHEN l.is_anonymous THEN NULL
             ELSE ur.reputation_score END                  AS seller_reputation,
        -- Primary image URL (null if no images uploaded yet)
        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = l.id AND li.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
      FROM listings l
      JOIN users u       ON l.seller_id   = u.id
      JOIN categories c  ON l.category_id = c.id
      LEFT JOIN user_reputation ur ON u.id = ur.user_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    // ── Count query (for pagination) 
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM listings l
      JOIN categories c ON l.category_id = c.id
      WHERE ${whereClause}
    `;

    const [listingsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2)),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      listings: listingsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        search,
        category,
        condition,
        minPrice,
        maxPrice,
        sortBy,
      },
    });

  } catch (err) {
    console.error("GET /api/listings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}