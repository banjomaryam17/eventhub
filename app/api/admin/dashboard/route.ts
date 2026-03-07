import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access only" },
      { status: 403 }
    );
  }

  return NextResponse.json({ message: "Welcome admin" });
}