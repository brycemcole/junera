import { getConnection } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function POST(req) {
  if (!SECRET_KEY) {
    console.error("JWT secret key is not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  console.log("POST /api/login");
  try {
    const { username, password } = await req.json();
    const pool = await getConnection();

    const result = await pool.request()
      .input("username", username)
      .query(`SELECT * FROM users WHERE username = @username;`);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = result.recordset[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Generate JWT token with explicit expiration
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        avatar: user.avatar,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, 
      SECRET_KEY
    );

    return NextResponse.json({ token });

  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Error logging in" }, { status: 500 });
  }
}
