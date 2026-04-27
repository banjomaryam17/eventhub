// app/api/me/addresses/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/me/addresses
// Returns all saved addresses for the user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        id,
        full_name,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
        created_at
       FROM shipping_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ addresses: result.rows });
  } catch (err) {
    console.error("GET /api/me/addresses error:", err);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST /api/me/addresses
// Creates a new shipping address for the user
export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      full_name,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default = false,
    } = await req.json();

    if (!full_name || !address_line1 || !city || !state || !postal_code || !country) {
      return NextResponse.json(
        { error: "All required address fields must be provided" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Clear existing default first before adding new
      if (is_default) {
        await client.query(
          `UPDATE shipping_addresses
           SET is_default = FALSE
           WHERE user_id = $1`,
          [session.userId]
        );
      }

      const existingResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM shipping_addresses
         WHERE user_id = $1`,
        [session.userId]
      );

      const shouldBeDefault =
        is_default || existingResult.rows[0].count === 0;

      const insertResult = await client.query(
        `INSERT INTO shipping_addresses
          (
            user_id,
            full_name,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            is_default
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING
          id,
          full_name,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country,
          is_default,
          created_at`,
        [
          session.userId,
          full_name.trim(),
          address_line1.trim(),
          address_line2?.trim() || null,
          city.trim(),
          state.trim(),
          postal_code.trim(),
          country.trim(),
          shouldBeDefault,
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        { address: insertResult.rows[0] },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/me/addresses error:", err);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}