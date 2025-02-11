'use server';

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from "@/lib/pgdb";
import { scanKeywords } from '@/lib/job-utils';
import { getCached, setCached } from '@/lib/cache';

export async function GET(req, { params }) {
  try {
    const id = await params.id;
    const authHeader = req.headers.get('Authorization');

    // First check cache
    const cacheKey = `job-posting:${id}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
          'X-Robots-Tag': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
          'Link': `<https://junera.us/job-postings/${id}>; rel="canonical"`,
        }
      });
    }

    // Get job posting details with job_id instead of id
    const jobResult = await query(`
      SELECT * FROM jobPostings WHERE job_id = $1
    `, [id]);

    if (!jobResult.rows[0]) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    const jobPosting = jobResult.rows[0];

    // Get related jobs in separate queries
    const [relatedCompanyJobs, similarTitleJobs] = await Promise.all([
      query(`
        SELECT 
          title,
          COUNT(*) as job_count
        FROM jobPostings 
        WHERE company = $1
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY title
        ORDER BY job_count DESC
        LIMIT 5
      `, [jobPosting.company]),
      
      query(`
        SELECT 
          title,
          COUNT(*) as job_count
        FROM jobPostings 
        WHERE title ILIKE $1
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY title
        ORDER BY job_count DESC
        LIMIT 5
      `, [`%${jobPosting.title}%`])
    ]);

    // Track view if user is authenticated
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        // Update view count using job_id
        await query(`
          UPDATE jobPostings 
          SET views = views + 1 
          WHERE job_id = $1
        `, [id]);

        // Track user view using job_id
        await query(`
          INSERT INTO user_interactions (user_id, job_posting_id, interaction_type)
          VALUES ($1, $2, 'view')
          ON CONFLICT (user_id, job_posting_id, interaction_type) 
          DO UPDATE SET interaction_date = CURRENT_TIMESTAMP
        `, [userId, id]);

        // Check if the job is bookmarked
        const bookmarkResult = await query(`
          SELECT 1 
          FROM user_interactions 
          WHERE user_id = $1 
          AND job_posting_id = $2 
          AND interaction_type = 'bookmark'
          LIMIT 1
        `, [userId, id]);

        jobPosting.isBookmarked = bookmarkResult.rows.length > 0;
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    }
    
    // Extract keywords from description
    const keywords = scanKeywords(jobPosting.description);

    const responseBody = {
      success: true,
      data: jobPosting,
      keywords,
      similarJobs: similarTitleJobs.rows,
      companyJobs: relatedCompanyJobs.rows
    };

    // Cache the response
    await setCached(cacheKey, JSON.stringify(responseBody), 3600); // Cache for 1 hour

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
        'X-Robots-Tag': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
        'Link': `<https://junera.us/job-postings/${id}>; rel="canonical"`,
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { 
      status: 500 
    });
  }
}
