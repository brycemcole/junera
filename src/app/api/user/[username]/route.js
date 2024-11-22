
import { getConnection } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { username } = await params;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("username", username)
      .query(`
        SELECT 
          id, username, firstname, lastname,
          avatar, desired_job_title, professionalSummary
        FROM users 
        WHERE username = @username
      `);

    const user = result.recordset[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Error fetching profile" }, { status: 500 });
  }
}