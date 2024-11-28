
import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';
import sql from 'mssql';

export async function POST(req, { params }) {
  try {
    console.log('Tracking job view...');
    const { id } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update view count
      await transaction.request()
        .input('jobId', sql.NVarChar, id)
        .query('UPDATE jobPostings SET views = ISNULL(views, 0) + 1 WHERE id = @jobId');
      
      // Add to recently viewed
      await transaction.request()
        .input('userId', sql.NVarChar, userId)
        .input('jobId', sql.NVarChar, id)
        .query(`
          MERGE INTO user_recent_viewed_jobs AS target
          USING (SELECT @userId as user_id, @jobId as jobPostings_id) AS source
          ON target.user_id = source.user_id AND target.jobPostings_id = source.jobPostings_id
          WHEN MATCHED THEN
            UPDATE SET viewed_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (user_id, jobPostings_id, viewed_at, company_id)
            VALUES (@userId, @jobId, GETDATE(), (SELECT company_id FROM jobPostings WHERE id = @jobId));
        `);

      await transaction.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error tracking job view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}