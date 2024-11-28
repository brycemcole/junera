import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        SELECT TOP 10
        fj.created_at AS bookmarkedAt,
          jp.id,
          jp.title,
          c.name as company
        FROM favorites_jobs fj
        JOIN jobPostings jp ON fj.job_posting_id = jp.id
        JOIN companies c ON jp.company_id = c.id
        WHERE fj.user_id = @userId
        ORDER BY fj.created_at DESC;
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}