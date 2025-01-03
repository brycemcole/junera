import { query } from "@/lib/pgdb";
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    // Verify token and get user ID
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // First, get user's saved searches
    const savedSearchesResult = await query(
      'SELECT search_criteria FROM saved_searches WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (!savedSearchesResult.rows.length) {
      return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
    }

    // Build a combined query for all saved searches
    let combinedQuery = `
      SELECT DISTINCT
        job_id,
        title,
        company,
        location,
        description,
        experiencelevel,
        created_at
      FROM jobPostings
      WHERE FALSE
    `; // Start with FALSE to use OR for each search

    const params = [];
    let paramIndex = 1;

    // Add conditions for each saved search
    savedSearchesResult.rows.forEach(savedSearch => {
      const criteria = savedSearch.search_criteria;
      
      combinedQuery += ` OR (1=1`; // Start a new group of conditions

      if (criteria.title) {
        combinedQuery += ` AND title_vector @@ to_tsquery('english', $${paramIndex})`;
        params.push(criteria.title.trim().replace(/\s+/g, ' & '));
        paramIndex++;
      }

      if (criteria.experienceLevel) {
        combinedQuery += ` AND LOWER(experiencelevel) = $${paramIndex}`;
        params.push(criteria.experienceLevel.toLowerCase());
        paramIndex++;
      }

      if (criteria.location) {
        combinedQuery += ` AND location_vector @@ to_tsquery('simple', $${paramIndex})`;
        params.push(criteria.location.replace(/\s+/g, ' & '));
        paramIndex++;
      }

      combinedQuery += ')';
    });

    combinedQuery += `
      ORDER BY created_at DESC
      LIMIT 20
    `;

    console.log('Query:', combinedQuery);
    console.log('Params:', params);

    const result = await query(combinedQuery, params);

    // Transform the results to include matching criteria
    const jobsWithCriteria = result.rows.map(job => {
      // Find which saved search matched this job
      const matchedSearch = savedSearchesResult.rows.find(search => {
        const criteria = search.search_criteria;
        return (
          (!criteria.title || job.title.toLowerCase().includes(criteria.title.toLowerCase())) &&
          (!criteria.experienceLevel || job.experiencelevel.toLowerCase() === criteria.experienceLevel.toLowerCase()) &&
          (!criteria.location || job.location.toLowerCase().includes(criteria.location.toLowerCase()))
        );
      });

      return {
        ...job,
        matchedSearch: matchedSearch ? matchedSearch.search_name : 'Any',
        matchingCriteria: matchedSearch ? matchedSearch.search_criteria : null
      };
    });

    return new Response(JSON.stringify({ 
      jobs: jobsWithCriteria,
      matchCount: result.rowCount 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching matching jobs:", error);
    return new Response(JSON.stringify({ 
      error: "Error fetching matching jobs",
      details: error.message 
    }), { status: 500 });
  }
}
