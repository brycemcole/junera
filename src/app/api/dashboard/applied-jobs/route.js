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

    const result = await query(`
      SELECT 
        ui.interaction_date AS applied_at,
        jp.*
      FROM user_interactions ui
      JOIN jobPostings jp ON ui.job_posting_id = jp.job_id
      WHERE ui.user_id = $1 
      AND ui.interaction_type = 'apply'
      ORDER BY ui.interaction_date DESC
    `, [userId]);

    const appliedJobs = result.rows.map(job => ({
      id: job.job_id,
      title: he.decode(job.title || ''),
      company: job.company || '',
      companyLogo: `https://logo.clearbit.com/${encodeURIComponent((job.company || '').replace('.com', ''))}.com`,
      location: job.location || '',
      experienceLevel: job.experiencelevel || '',
      description: he.decode(job.description || ''),
      postedDate: job.created_at?.toISOString() || '',
      appliedAt: job.applied_at?.toISOString() || ''
    }));

    return NextResponse.json({ appliedJobs });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
