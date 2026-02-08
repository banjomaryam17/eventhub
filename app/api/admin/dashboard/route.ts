import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (!session) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  const { role } = JSON.parse(session.value);

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Admin access only" },
      { status: 403 }
    );
  }

  return NextResponse.json({ message: "Welcome admin" });
}
