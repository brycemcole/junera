import { query } from "@/lib/pgdb";
import { setCached, getCached } from "@/lib/cache";

const JOB_CATEGORIES = {
  'Software Engineer': [
    'Software Engineer',
    'Software Developer',
    'Full Stack Engineer',
    'Backend Engineer',
    'Frontend Engineer'
  ],
  'Product Manager': [
    'Product Manager',
    'Technical Product Manager',
    'Senior Product Manager',
    'Product Owner'
  ],
  'Data Analyst': [
    'Data Analyst',
    'Business Analyst',
    'Data Scientist',
    'Analytics Engineer'
  ],
  'Legal': [
    'Attorney',
    'Lawyer',
    'Legal Counsel',
    'Corporate Counsel'
  ]
};

export async function GET() {
  try {

    const cacheKey = 'trending-jobs';
    const cachedResult = await getCached(cacheKey);
    if (cachedResult) {
      return Response.json(cachedResult);
    }
    const results = [];
    
    // Query each job category
    for (const [category, titles] of Object.entries(JOB_CATEGORIES)) {
      const titleConditions = titles.map(title => `title ILIKE '%${title}%'`).join(' OR ');
      
      const queryText = `
        WITH job_counts AS (
          SELECT 
            title,
            COUNT(*) as count
          FROM jobPostings
          WHERE (${titleConditions})
          AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY title
          HAVING COUNT(*) > 5
        )
        SELECT 
          title,
          count,
          '${category}' as category
        FROM job_counts
        ORDER BY count DESC
        LIMIT 1;
      `;

      const result = await query(queryText);
      if (result.rows[0]) {
        results.push(result.rows[0]);
      }
    }

    // Store in cache
    await setCached(cacheKey, { trendingJobs: results, ok: true }, 60 * 60);
    
    return Response.json({ 
      trendingJobs: results,
      ok: true 
    });

  } catch (error) {
    console.error("Error fetching trending job titles:", error);
    return Response.json({ 
      error: "Error fetching trending job titles", 
      ok: false 
    }, { 
      status: 500 
    });
  }
}

export const dynamic = 'force-dynamic';