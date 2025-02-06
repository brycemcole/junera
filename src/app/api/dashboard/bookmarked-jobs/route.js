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
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;  // Changed from decoded.userId to decoded.id

    console.log('Fetching bookmarked jobs for user:', userId);

    // Check cache first - now properly awaited and using userId
    const cacheKey = `bookmarked-jobs:${userId}`;
    const cachedBookmarkedJobs = await getCached(cacheKey);
    if (cachedBookmarkedJobs) {
      console.log('Cache hit for user:', userId);
      return NextResponse.json(cachedBookmarkedJobs);
    }

    console.log('Cache miss for user:', userId);

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

    console.log('Fetched bookmarked jobs:', result.rows.length);

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

    // Cache the results with userId instead of token
    await setCached(cacheKey, bookmarkedJobs, 300);

    return NextResponse.json(bookmarkedJobs);  // Return directly without nesting
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';