// /pages/api/register.js 
import { query } from "@/lib/pgdb";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

async function loginUser(emailOrUsername, password) {
  const result = await query(`
    SELECT id, password, username, full_name, avatar, email, job_prefs_title, job_prefs_location
    FROM users
    WHERE email = $1 OR username = $1;
  `, [emailOrUsername]);

  if (result.rows.length === 0) {
    return { error: "User not found" };
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Invalid password" };
  }

  return { userId: user.id, email: user.email, username: user.username, fullName: user.full_name, avatar: user.avatar || '/default.png', jobPrefsTitle: user.job_prefs_title, jobPrefsLocation: user.job_prefs_location };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { emailOrUsername, password } = body;

    if (!emailOrUsername || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const result = await loginUser(emailOrUsername, password);
    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }

    const token = jwt.sign({ 
      id: result.userId, 
      email: result.email, 
      fullName: result.fullName, 
      username: result.username, 
      avatar: result.avatar, 
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, 
      jobPrefsTitle: result.jobPrefsTitle, 
      jobPrefsLocation: result.jobPrefsLocation 
    }, SECRET_KEY);

    return new Response(JSON.stringify({ token }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return new Response(JSON.stringify({ error: "Error logging in user" }), { status: 500 });
  }
}