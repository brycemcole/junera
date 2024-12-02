import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
    const token = authHeader.split(' ')[1];
  
  // Verify token and get user_id
  try {
    console.log('JWT_SECRET:', process.env.SESSION_SECRET); // Add this line for debugging
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    const userId = decoded.id; // Adjust based on token payload structure
    console.log('Decoded userId:', decoded); // Add this line for debugging

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    // Connect to the database
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        SELECT 
          jp.id AS jobId,
          jp.title AS title,
          c.name AS company,
          c.logo AS logo,
          jp.location AS location,
          jp.experienceLevel AS experienceLevel,
          jp.postedDate AS postedDate,
          jp.salary AS salary,
          urv.viewed_at AS viewedAt
        FROM dbo.user_recent_viewed_jobs urv
        INNER JOIN dbo.jobPostings jp ON urv.jobPostings_id = jp.id
        INNER JOIN dbo.companies c ON jp.company_id = c.id
        WHERE urv.user_id = @userId
        ORDER BY urv.viewed_at DESC
        OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
      `);

    // Optionally, transform the data if needed
    const formattedResults = result.recordset.map(job => ({
      id: job.jobId,
      title: job.title,
      company: job.company,
      logo: job.logo,
      location: job.location,
      experienceLevel: job.experienceLevel,
      postedDate: job.postedDate,
      salary: job.salary,
      viewedAt: job.viewedAt,
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Error fetching recently viewed jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
