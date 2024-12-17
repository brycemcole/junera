import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/pgdb';
const he = require('he');

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    // Query recently viewed jobs using user_interactions
    const result = await query(`
      SELECT 
        ui.interaction_date AS viewed_at,
        jp.*,
        (SELECT COUNT(*) FROM user_interactions 
         WHERE job_posting_id = jp.job_id 
         AND interaction_type = 'view') as total_views
      FROM user_interactions ui
      JOIN jobPostings jp ON ui.job_posting_id = jp.job_id
      WHERE ui.user_id = $1 
      AND ui.interaction_type = 'view'
      ORDER BY ui.interaction_date DESC
      LIMIT 10
    `, [userId]);

    const recentlyViewed = result.rows.map(job => ({
      id: job.job_id,
      title: he.decode(job.title || ''),
      company: job.company || '',
      companyLogo: `https://logo.clearbit.com/${encodeURIComponent((job.company || '').replace('.com', ''))}.com`,
      location: job.location || '',
      experienceLevel: job.experiencelevel || '',
      description: he.decode(job.description || ''),
      postedDate: job.created_at?.toISOString() || '',
      viewedAt: job.viewed_at?.toISOString() || '',
      totalViews: parseInt(job.total_views) || 0
    }));

    return NextResponse.json(recentlyViewed);

  } catch (error) {
    console.error('Error fetching recently viewed jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';