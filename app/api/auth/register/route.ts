import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password, username} = await req.json();

  // Server-side validation
  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO users (email,username, password_hash)
       VALUES ($1, $2, $3)`,
      [email, passwordHash]
    );
    // pre-check if username or email exists
  const existing = await pool.query(
  "SELECT id FROM users WHERE email = $1 OR username = $2",
  [email, username]
    );

  if (existing.rows.length > 0) {
  return NextResponse.json(
    { error: "Email or username already in use" },
    { status: 409 }
    );
  }


    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
