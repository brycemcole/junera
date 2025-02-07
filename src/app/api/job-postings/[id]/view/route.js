import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

async function logInteraction(userId, jobId, interactionType) {
  console.log('Logging interaction:', { userId, jobId, interactionType });

  const result = await query(`
    INSERT INTO user_interactions (user_id, job_posting_id, interaction_type, interaction_date)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, job_posting_id, interaction_type)
    DO UPDATE SET interaction_date = NOW()
    RETURNING *
  `, [userId, jobId, interactionType]);

  console.log('Interaction logged:', result.rows[0]);
  return result.rows[0];
}

export async function POST(req, { params }) {
  try {
    console.log('Tracking job view...');
    const { id } = params;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.log('No auth header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    console.log('Processing view for:', { userId, jobId: id });

    // Begin transaction
    await query('BEGIN');

    try {
      // Update view count
      const viewResult = await query(
        'UPDATE jobPostings SET views = COALESCE(views, 0) + 1 WHERE job_id = $1 RETURNING views',
        [id]
      );
      console.log('Updated view count:', viewResult.rows[0]);

      // Log view interaction
      const interaction = await logInteraction(userId, id, 'view');

      // Commit transaction
      await query('COMMIT');

      return NextResponse.json({
        success: true,
        views: viewResult.rows[0]?.views,
        interaction
      });
    } catch (error) {
      console.error('Error in transaction:', error);
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error tracking job view:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';