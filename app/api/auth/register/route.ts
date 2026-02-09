import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users (email, username, password_hash, role)
      VALUES ($1, $2, $3, 'user')
      `
      ,
      [email, username, passwordHash]
    );

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

  } catch (err: any) {
    // unique constraint violation
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 409 }
      );
    }

    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
