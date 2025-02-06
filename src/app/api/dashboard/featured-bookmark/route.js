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
      SELECT jp.* FROM user_interactions ui
      JOIN jobPostings jp ON ui.job_posting_id = jp.job_id
      WHERE ui.user_id = $1 
      AND ui.interaction_type = 'bookmark'
      ORDER BY RANDOM()
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    const job = result.rows[0];
    const featuredJob = {
      id: job.job_id,
      title: he.decode(job.title || ''),
      displayTitle: "Featured Job You've Saved", // Add a friendly display title
      company: job.company,
      companyLogo: `https://logo.clearbit.com/${encodeURIComponent((job.company || '').replace('.com', ''))}.com`,
      location: job.location,
      experienceLevel: job.experiencelevel,
      shortDescription: he.decode(job.description || '').substring(0, 250) + '...' // Shorter description
    };

    return NextResponse.json(featuredJob);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}