import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildAddressString, geocodeAddress } from "@/lib/geo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id);

    const session = await getSession();
    const viewerId = session?.userId ?? null;

    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT
        l.id,
        l.title,
        l.description,
        l.price,
        l.quantity,
        l.condition,
        l.is_anonymous,
        l.is_active,
        l.average_rating,
        l.review_count,
        l.created_at,
        l.updated_at,

        l.pickup_address_line1,
        l.pickup_city,
        l.pickup_state,
        l.pickup_postal_code,
        l.pickup_country,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        CASE
          WHEN l.is_anonymous AND (u.id != $2 OR $2 IS NULL)
          THEN NULL
          ELSE u.id
        END AS seller_id,

        CASE
          WHEN l.is_anonymous AND (u.id != $2 OR $2 IS NULL)
          THEN 'Anonymous'
          ELSE u.username
        END AS seller_username,

        CASE
          WHEN l.is_anonymous AND (u.id != $2 OR $2 IS NULL)
          THEN NULL
          ELSE (
            SELECT COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN oi.order_id END)
            FROM listings sl
            LEFT JOIN order_items oi ON oi.listing_id = sl.id
            LEFT JOIN orders o ON o.id = oi.order_id
            WHERE sl.seller_id = u.id
          )
        END AS seller_total_sales,

        CASE
          WHEN l.is_anonymous AND (u.id != $2 OR $2 IS NULL)
          THEN NULL
          ELSE COALESCE((
            SELECT ROUND(AVG(r.rating) * 20)
            FROM reviews r
            JOIN listings rl ON rl.id = r.listing_id
            WHERE rl.seller_id = u.id
          ), 100)
        END AS seller_reputation,

        CASE
          WHEN l.is_anonymous AND (u.id != $2 OR $2 IS NULL)
          THEN NULL::boolean
          ELSE (
            SELECT COALESCE(ROUND(AVG(r.rating) * 20), 100) >= 85
            FROM reviews r
            JOIN listings rl ON rl.id = r.listing_id
            WHERE rl.seller_id = u.id
          )
        END AS seller_is_verified

       FROM listings l
       JOIN users u ON l.seller_id = u.id
       JOIN categories c ON l.category_id = c.id
       WHERE l.id = $1`,
      [listingId, viewerId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = result.rows[0];

    const imagesResult = await pool.query(
      `SELECT id, image_url, is_primary, sort_order
       FROM listing_images
       WHERE listing_id = $1
       ORDER BY is_primary DESC, sort_order ASC`,
      [listingId],
    );

    const reviewsResult = await pool.query(
      `SELECT
        r.id,
        r.rating,
        r.content,
        r.created_at,
        u.username AS reviewer_username
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.listing_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [listingId],
    );

    return NextResponse.json({
      listing: {
        ...listing,
        images: imagesResult.rows,
        reviews: reviewsResult.rows,
      },
    });
  } catch (err) {
    console.error("GET /api/listings/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);

    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    const existing = await pool.query(
      "SELECT id, seller_id FROM listings WHERE id = $1",
      [listingId],
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.rows[0].seller_id !== session.userId) {
      return NextResponse.json(
        { error: "You can only edit your own listings" },
        { status: 403 },
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
      is_active,

      pickup_address_line1,
      pickup_city,
      pickup_state,
      pickup_postal_code,
      pickup_country,
    } = body;

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 3) {
        return NextResponse.json(
          { error: "Title must be at least 3 characters" },
          { status: 400 },
        );
      }

      if (title.trim().length > 150) {
        return NextResponse.json(
          { error: "Title must be 150 characters or less" },
          { status: 400 },
        );
      }
    }

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);

      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { error: "Price must be a positive number" },
          { status: 400 },
        );
      }
    }

    if (quantity !== undefined) {
      const parsedQty = parseInt(quantity);

      if (isNaN(parsedQty) || parsedQty < 0) {
        return NextResponse.json(
          { error: "Quantity must be 0 or more" },
          { status: 400 },
        );
      }
    }

    const validConditions = ["new", "used", "refurbished"];

    if (condition !== undefined && !validConditions.includes(condition)) {
      return NextResponse.json(
        { error: "Condition must be new, used, or refurbished" },
        { status: 400 },
      );
    }

    if (category_id !== undefined) {
      const categoryCheck = await pool.query(
        "SELECT id FROM categories WHERE id = $1",
        [parseInt(category_id)],
      );

      if (categoryCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Selected category does not exist" },
          { status: 400 },
        );
      }
    }

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description?.trim() ?? null);
    }

    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(parseFloat(price));
    }

    if (quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(parseInt(quantity));
    }

    if (condition !== undefined) {
      updates.push(`condition = $${paramIndex++}`);
      values.push(condition);
    }

    if (category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(parseInt(category_id));
    }

    if (is_anonymous !== undefined) {
      updates.push(`is_anonymous = $${paramIndex++}`);
      values.push(Boolean(is_anonymous));
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(Boolean(is_active));
    }

    if (
      pickup_address_line1 !== undefined ||
      pickup_city !== undefined ||
      pickup_state !== undefined ||
      pickup_postal_code !== undefined ||
      pickup_country !== undefined
    ) {
      if (
        !pickup_address_line1 ||
        !pickup_city ||
        !pickup_state ||
        !pickup_postal_code
      ) {
        return NextResponse.json(
          { error: "Complete pickup address is required for local pickup" },
          { status: 400 },
        );
      }

      const pickupAddress = buildAddressString({
        address_line1: pickup_address_line1,
        city: pickup_city,
        state: pickup_state,
        postal_code: pickup_postal_code,
        country: pickup_country || "Ireland",
      });

      const pickupCoords = await geocodeAddress(pickupAddress).catch(
        () => null,
      );

      updates.push(`pickup_address_line1 = $${paramIndex++}`);
      values.push(pickup_address_line1.trim());

      updates.push(`pickup_city = $${paramIndex++}`);
      values.push(pickup_city.trim());

      updates.push(`pickup_state = $${paramIndex++}`);
      values.push(pickup_state.trim());

      updates.push(`pickup_postal_code = $${paramIndex++}`);
      values.push(pickup_postal_code.trim());

      updates.push(`pickup_country = $${paramIndex++}`);
      values.push((pickup_country || "Ireland").trim());

      updates.push(`pickup_latitude = $${paramIndex++}`);
      values.push(pickupCoords?.lat ?? null);

      updates.push(`pickup_longitude = $${paramIndex++}`);
      values.push(pickupCoords?.lng ?? null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    values.push(listingId);

    const updateResult = await pool.query(
      `UPDATE listings
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, title, price, quantity, condition, is_active, updated_at`,
      values,
    );

    return NextResponse.json({
      message: "Listing updated successfully",
      listing: updateResult.rows[0],
    });
  } catch (err) {
    console.error("PUT /api/listings/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);

    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: "Invalid listing ID" },
        { status: 400 },
      );
    }

    const existing = await pool.query(
      "SELECT id, seller_id FROM listings WHERE id = $1",
      [listingId],
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isOwner = existing.rows[0].seller_id === session.userId;
    const isAdmin = session.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this listing" },
        { status: 403 },
      );
    }

    await pool.query(
      "UPDATE listings SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [listingId],
    );

    return NextResponse.json({ message: "Listing removed successfully" });
  } catch (err) {
    console.error("DELETE /api/listings/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 },
    );
  }
}
