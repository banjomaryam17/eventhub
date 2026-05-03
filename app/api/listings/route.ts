import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildAddressString, geocodeAddress } from "@/lib/geo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";
    const condition = searchParams.get("condition")?.trim() ?? "";
    const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "999999");
    const sortBy = searchParams.get("sortBy") ?? "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24")));
    const offset = (page - 1) * limit;

    const validConditions = ["new", "used", "refurbished"];

    if (condition && !validConditions.includes(condition)) {
      return NextResponse.json(
        { error: "Invalid condition. Must be new, used, or refurbished." },
        { status: 400 }
      );
    }

    const validSorts: Record<string, string> = {
      newest: "l.created_at DESC",
      oldest: "l.created_at ASC",
      price_asc: "l.price ASC",
      price_desc: "l.price DESC",
      top_rated: "l.average_rating DESC",
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
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        CASE WHEN l.is_anonymous THEN NULL ELSE u.id END AS seller_id,
        CASE WHEN l.is_anonymous THEN 'Anonymous' ELSE u.username END AS seller_username,
        CASE WHEN l.is_anonymous THEN NULL ELSE ur.is_verified_seller END AS seller_is_verified,
        CASE WHEN l.is_anonymous THEN NULL ELSE ur.reputation_score END AS seller_reputation,

        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = l.id AND li.is_primary = TRUE
          LIMIT 1
        ) AS primary_image

      FROM listings l
      JOIN users u ON l.seller_id = u.id
      JOIN categories c ON l.category_id = c.id
      LEFT JOIN user_reputation ur ON u.id = ur.user_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

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

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to create a listing" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      price,
      quantity,
      condition,
      category_id,
      is_anonymous,
      image_url,

      pickup_address_line1,
      pickup_city,
      pickup_state,
      pickup_postal_code,
      pickup_country,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or less" },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const validConditions = ["new", "used", "refurbished"];

    if (!condition || !validConditions.includes(condition)) {
      return NextResponse.json(
        { error: "Condition must be new, used, or refurbished" },
        { status: 400 }
      );
    }

    if (!category_id || isNaN(parseInt(category_id))) {
      return NextResponse.json(
        { error: "A valid category is required" },
        { status: 400 }
      );
    }

    const categoryCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1",
      [parseInt(category_id)]
    );

    if (categoryCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Selected category does not exist" },
        { status: 400 }
      );
    }

    if (
      !pickup_address_line1 ||
      !pickup_city ||
      !pickup_state ||
      !pickup_postal_code
    ) {
      return NextResponse.json(
        { error: "Pickup address is required for local collection logic" },
        { status: 400 }
      );
    }

    const pickupAddress = buildAddressString({
      address_line1: pickup_address_line1,
      city: pickup_city,
      state: pickup_state,
      postal_code: pickup_postal_code,
      country: pickup_country || "Ireland",
    });

    const pickupCoords = await geocodeAddress(pickupAddress);

    if (!pickupCoords) {
      return NextResponse.json(
        { error: "Could not find the pickup location. Please check the address." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO listings
        (
          seller_id,
          category_id,
          title,
          description,
          price,
          quantity,
          condition,
          is_anonymous,
          pickup_address_line1,
          pickup_city,
          pickup_state,
          pickup_postal_code,
          pickup_country,
          pickup_latitude,
          pickup_longitude
        )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, title, price, condition, is_active, created_at`,
      [
        session.userId,
        parseInt(category_id),
        title.trim(),
        description?.trim() ?? null,
        parsedPrice,
        parsedQuantity,
        condition,
        is_anonymous === true,

        pickup_address_line1.trim(),
        pickup_city.trim(),
        pickup_state.trim(),
        pickup_postal_code.trim(),
        pickup_country?.trim() || "Ireland",
        pickupCoords.lat,
        pickupCoords.lng,
      ]
    );

    const newListing = result.rows[0];

    if (image_url && typeof image_url === "string" && image_url.trim()) {
      await pool.query(
        `INSERT INTO listing_images (listing_id, image_url, is_primary)
         VALUES ($1, $2, TRUE)`,
        [newListing.id, image_url.trim()]
      );
    }

    await pool.query(
      `INSERT INTO user_reputation (user_id)
       VALUES ($1)
       ON CONFLICT DO NOTHING`,
      [session.userId]
    );

    return NextResponse.json(
      {
        message: "Listing created successfully",
        listing: {
          id: newListing.id,
          title: newListing.title,
          price: newListing.price,
          condition: newListing.condition,
          is_active: newListing.is_active,
          created_at: newListing.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/listings error:", err);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}