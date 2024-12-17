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