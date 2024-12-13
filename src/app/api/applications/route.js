
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/pgdb';

export async function POST(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;
    const body = await request.json();
    const jobPostingId = body.jobPostingId;

    if (!userId || !jobPostingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await query(`
      INSERT INTO user_interactions (user_id, job_posting_id, interaction_type, interaction_date)
      VALUES ($1, $2, 'apply', NOW())
      ON CONFLICT (user_id, job_posting_id, interaction_type) 
      DO UPDATE SET interaction_date = NOW()
    `, [userId, jobPostingId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ isApplied: false });
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

    const result = await query(`
      SELECT COUNT(1) as count
      FROM user_interactions 
      WHERE user_id = $1 
      AND job_posting_id = $2
      AND interaction_type = 'apply'
    `, [userId, jobId]);

    return NextResponse.json({
      isApplied: result.rows[0].count > 0
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ isApplied: false });
  }
}