import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/pgdb';
import { getCached, setCached } from '@/lib/cache';
const he = require('he');

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    // Check cache first
    const cachedBookmarkedJobs = getCached('bookmarked-jobs', token);
    if (cachedBookmarkedJobs) {
      return NextResponse.json({ bookmarkedJobs: cachedBookmarkedJobs });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        ui.interaction_date AS bookmarked_at,
        jp.*
      FROM user_interactions ui
      JOIN jobPostings jp ON ui.job_posting_id = jp.job_id
      WHERE ui.user_id = $1 
      AND ui.interaction_type = 'bookmark'
      ORDER BY ui.interaction_date DESC
    `, [userId]);

    console.log('Query result:', result.rows);

    const bookmarkedJobs = result.rows.map(job => ({
      id: job.job_id,
      title: he.decode(job.title || ''),
      company: job.company || '',
      companyLogo: `https://logo.clearbit.com/${encodeURIComponent((job.company || '').replace('.com', ''))}.com`,
      location: job.location || '',
      experienceLevel: job.experiencelevel || '',
      description: he.decode(job.description || ''),
      postedDate: job.created_at?.toISOString() || '',
      bookmarkedAt: job.bookmarked_at?.toISOString() || ''
    }));

    // Cache the results
    setCached('bookmarked-jobs', token, bookmarkedJobs);

    return NextResponse.json({ bookmarkedJobs });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';