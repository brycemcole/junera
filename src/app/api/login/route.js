// /pages/api/register.js 
import { query } from "@/lib/pgdb";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

async function loginUser(email, password) {
  const result = await query(`
    SELECT id, password, username, full_name, avatar, email
    FROM users
    WHERE email = $1;
  `, [email]);

  if (result.rows.length === 0) {
    return { error: "User not found" };
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Invalid password" };
  }

  return { userId: user.id, email: user.email, username: user.username, fullName: user.full_name, avatar: user.avatar || '/default.png' };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim() || "";
  const password = searchParams.get("password")?.trim() || "";

  try {
    const result = await loginUser(email, password);
    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }

    const token = jwt.sign({ id: result.userId, email: result.email, fullName: result.fullName, username: result.username, avatar: result.avatar, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, SECRET_KEY);

    return new Response(JSON.stringify({ token }), { status: 200 });
  }
  catch (error) {
    console.error("Error logging in user:", error);
    return new Response(JSON.stringify({ error: "Error logging in user" }), { status: 500 });
  }
}