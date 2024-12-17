// /pages/api/register.js 
import { query } from "@/lib/pgdb";
import bcrypt from 'bcrypt';

async function createUserAccount(fullname, email, username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return query(`
    INSERT INTO users (full_name, email, username, password, last_login, created_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING id;
  `, [fullname, email, username, hashedPassword]);
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const fullname = searchParams.get("fullname")?.trim() || "";
    const email = searchParams.get("email")?.trim() || "";
    const username = searchParams.get("username")?.trim() || "";
    const password = searchParams.get("password")?.trim() || "";

    try {
        const result = await createUserAccount(fullname, email, username, password);
        console.log('result: ', result);
        console.log('User ID:', result.rows[0]?.id);
        const userId = result.rows[0]?.id || 0;

        return new Response(JSON.stringify({ userId }), { status: 200 });
    } catch (error) {
        console.error("Error creating user account:", error);
        return new Response(JSON.stringify({ error: "Error creating user account" }), { status: 500 });
    }
}