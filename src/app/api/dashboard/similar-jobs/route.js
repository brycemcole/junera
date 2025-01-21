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
    const userId = decoded.id;

    // First get a random recently applied job
    const recentJob = await query(`
      SELECT jp.* FROM user_interactions ui
      JOIN jobPostings jp ON ui.job_posting_id = jp.job_id
      WHERE ui.user_id = $1 AND ui.interaction_type = 'apply'
      ORDER BY RANDOM()
      LIMIT 1
    `, [userId]);

    if (recentJob.rows.length === 0) {
      return NextResponse.json({ baseJob: null, similarJobs: [] });
    }

    const baseJob = recentJob.rows[0];

    // Find similar jobs using word similarity
    const similarJobs = await query(`
      SELECT DISTINCT jp.*, 
        word_similarity(LOWER(jp.title), LOWER($1)) as title_similarity
      FROM jobPostings jp
      WHERE jp.job_id != $2
      AND jp.job_id NOT IN (
        SELECT job_posting_id FROM user_interactions 
        WHERE user_id = $3 AND interaction_type = 'apply'
      )
      AND word_similarity(LOWER(jp.title), LOWER($1)) > 0.3
      ORDER BY title_similarity DESC
      LIMIT 5
    `, [baseJob.title, baseJob.job_id, userId]);

    const response = {
      baseJob: {
        id: baseJob.job_id,
        title: he.decode(baseJob.title || ''),
        company: baseJob.company,
        companyLogo: `https://logo.clearbit.com/${encodeURIComponent((baseJob.company || '').replace('.com', ''))}.com`,
        location: baseJob.location,
        experienceLevel: baseJob.experiencelevel,
        shortDescription: he.decode(baseJob.description || '').substring(0, 200) + '...' // Add a short description
      },
      similarJobs: similarJobs.rows.map(job => ({
        id: job.job_id,
        title: he.decode(job.title || ''),
        company: job.company,
        companyLogo: `https://logo.clearbit.com/${encodeURIComponent((job.company || '').replace('.com', ''))}.com`,
        location: job.location,
        experienceLevel: job.experiencelevel,
        similarity: Math.round(job.title_similarity * 100) // Add similarity score
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
