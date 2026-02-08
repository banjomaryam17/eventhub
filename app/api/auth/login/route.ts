import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";
import { error } from "console";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    //validation of email and password
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    // Search for users by email
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    // compare password if they match
    const passwordMatch = await bcrypt.compare(password,user.password_hash);
    if(!passwordMatch){
        NextResponse.json(
            {error: "Invalid email or password" },
            {status: 401}
        );
    }
    const cookieStore = await cookies();
    cookieStore.set(
      "session",
      JSON.stringify({
        userId: user.id,
        role: user.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );
     return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
