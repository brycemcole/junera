import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

async function logInteraction(userId, jobId, interactionType) {
  await query(`
    INSERT INTO user_interactions (user_id, job_posting_id, interaction_type)
    VALUES ($1, $2, $3)
  `, [userId, jobId, interactionType]);
}

export async function POST(req, { params }) {
  try {
    console.log('Tracking job view...');
    const { id } = params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    // Begin transaction
    await query('BEGIN');

    try {
      // Update view count
      await query(
        'UPDATE jobPostings SET views = COALESCE(views, 0) + 1 WHERE job_id = $1',
        [id]
      );

      // Add to recently viewed
      await query(`
        INSERT INTO user_recent_viewed_jobs (user_id, jobpostings_id, viewed_at, company_id)
        VALUES ($1, $2, NOW(), (SELECT company_id FROM jobPostings WHERE job_id = $3))
        ON CONFLICT (user_id, jobpostings_id)
        DO UPDATE SET viewed_at = NOW()
      `, [userId, id, id]);

      // Commit transaction
      await query('COMMIT');

      // Log view interaction
      await logInteraction(userId, id, 'view');

      return NextResponse.json({ success: true });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error tracking job view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function bookmarkJob(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    // Log bookmark interaction
    await logInteraction(userId, id, 'bookmark');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error bookmarking job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function applyJob(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    // Log apply interaction
    await logInteraction(userId, id, 'apply');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error applying to job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';