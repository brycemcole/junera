import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/pgdb';
import { getCached, setCached, clearCache } from '@/lib/cache';

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

    // Check cache first
    const cacheKey = `bookmark:${userId}:${jobId}`;
    const cachedResult = await getCached(cacheKey);

    if (cachedResult !== null) {
      return NextResponse.json({
        isBookmarked: cachedResult
      });
    }

    const result = await query(`
      SELECT COUNT(1) as count
      FROM user_interactions 
      WHERE user_id = $1 
      AND job_posting_id = $2
      AND interaction_type = 'bookmark'
    `, [userId, jobId]);

    const isBookmarked = result.rows[0].count > 0;

    // Cache the result for 1 hour
    await setCached(cacheKey, isBookmarked, 3600);

    return NextResponse.json({
      isBookmarked
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ isBookmarked: false }, { status: 500 });
  }
}

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
      INSERT INTO user_interactions (user_id, job_posting_id, interaction_type)
      VALUES ($1, $2, 'bookmark')
      ON CONFLICT (user_id, job_posting_id, interaction_type) DO NOTHING
    `, [userId, jobPostingId]);

    // Update cache after successful bookmark
    const cacheKey = `bookmark:${userId}:${jobPostingId}`;
    await setCached(cacheKey, true, 3600);

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
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;
    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get('jobPostingId');

    if (!userId || !jobPostingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(`
      DELETE FROM user_interactions 
      WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = 'bookmark'
      RETURNING *
    `, [userId, jobPostingId]);

    const deleted = result.rowCount > 0;

    if (deleted) {
      // Clear cache after successful deletion
      const cacheKey = `bookmark:${userId}:${jobPostingId}`;
      await clearCache(cacheKey);
    }

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';