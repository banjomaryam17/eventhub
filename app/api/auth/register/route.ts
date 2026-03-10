import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    //Server-side format validation 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (
      typeof username !== "string" ||
      username.trim().length < 3 ||
      username.trim().length > 30 ||
      !/^[a-zA-Z0-9_]+$/.test(username.trim())
    ) {
      return NextResponse.json(
        { error: "Username must be 3–30 characters and contain only letters, numbers, or underscores" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12); 
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, username, role`,
      [email.toLowerCase().trim(), username.trim(), passwordHash]
    );

    const newUser = result.rows[0];

    await pool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [newUser.id]
    );
    const token = await new SignJWT({
      userId: newUser.id,
      role: newUser.role,
      username: newUser.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        role: newUser.role, 
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      "constraint" in err
    ) {
      const pgErr = err as { code: string; constraint: string };
      if (pgErr.code === "23505") {
        const field = pgErr.constraint?.includes("email") ? "email" : "username";
        return NextResponse.json(
          { error: `That ${field} is already in use` },
          { status: 409 }
        );
      }
    }

    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}