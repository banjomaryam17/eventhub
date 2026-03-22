import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const p = await params;
    const listingId = parseInt(p.id);

    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const existing = await pool.query(
      "SELECT id, title FROM listings WHERE id = $1",
      [listingId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await pool.query(
      "UPDATE listings SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [listingId]
    );

    return NextResponse.json({
      message: `Listing "${existing.rows[0].title}" has been removed`,
    });

  } catch (err) {
    console.error("DELETE /api/admin/listings/[id] error:", err);
    return NextResponse.json({ error: "Failed to remove listing" }, { status: 500 });
  }
}