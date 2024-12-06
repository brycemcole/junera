import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ isBookmarked: false });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
        return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        const pool = await getConnection();
        const query =`
                        SELECT COUNT(1) as count
                FROM favorites_jobs 
                WHERE user_id = @userId 
                AND job_posting_id = @jobId`;

        const result = await pool.executeQuery(query, { userId, jobId });

        return NextResponse.json({ 
            isBookmarked: result.recordset[0].count > 0 
        });
    } catch (error) {
        console.error('GET error:', error);
        return NextResponse.json({ isBookmarked: false });
    }
}

export async function POST(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    console.log('No auth header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;
    const body = await request.json();
    const jobPostingId = body.jobPostingId;

    console.log('Adding bookmark:', { userId, jobPostingId });

    if (!userId || !jobPostingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pool = await getConnection();
    const query = ` IF NOT EXISTS (
          SELECT 1 FROM favorites_jobs 
          WHERE user_id = @userId AND job_posting_id = @jobId
        )
        BEGIN
          INSERT INTO favorites_jobs (user_id, job_posting_id, created_at)
          VALUES (@userId, @jobId, GETDATE());
        END;
        SELECT 1 as success;`;
    await pool.executeQuery(query, { userId, jobPostingId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    const userId = decoded.id;
    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get('jobPostingId');

    console.log('Removing bookmark:', { userId, jobPostingId }); // Add debug log

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('jobId', sql.NVarChar, jobPostingId) // Changed to UniqueIdentifier
      .query(`
        DELETE FROM favorites_jobs 
        WHERE user_id = @userId AND job_posting_id = @jobId;
        SELECT @@ROWCOUNT as deleted;
      `);

    const deleted = result.recordset[0].deleted > 0;
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}