import { query } from "@/lib/pgdb";
import { getCached, setCached } from '@/lib/cache';
const he = require('he');

function scanKeywords(text) {
  // ...existing code...
}

function extractSalary(text) {
  // ...existing code...
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title")?.trim() || "";
  const experienceLevel = searchParams.get("experienceLevel")?.trim().toLowerCase() || "";
  const location = searchParams.get("location")?.trim().toLowerCase() || "";
  const limit = parseInt(searchParams.get("limit")) || 5;

  const cacheKey = `jobs-by-saved-search-${title}-${experienceLevel}-${location}-${limit}`;
  const cachedJobs = getCached(cacheKey);
  if (cachedJobs) {
    return new Response(JSON.stringify({ jobs: cachedJobs }), { status: 200 });
  }

  try {
    let queryText = `
      SELECT 
        id, 
        job_id,
        source_url,
        experiencelevel,
        title, 
        company, 
        location,
        description,
        created_at
      FROM jobPostings
      WHERE 1 = 1
    `;

    const params = [];
    let paramIndex = 1;

    // Use full-text search for title instead of ILIKE
    if (title) {
      queryText += ` AND title_vector @@ to_tsquery('english', $${paramIndex})`;
      params.push(title.trim().replace(/\s+/g, ' & '));
      paramIndex++;
    }

    // Use exact match for experience level
    if (experienceLevel) {
      queryText += ` AND LOWER(experiencelevel) = $${paramIndex}`;
      params.push(experienceLevel);
      paramIndex++;
    }

    // Use location vector for location search
    if (location) {
      queryText += ` AND location_vector @@ to_tsquery('simple', $${paramIndex})`;
      params.push(location.replace(/\s+/g, ' & '));
      paramIndex++;
    }

    queryText += `
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    console.log('Query:', queryText); // Add logging
    console.log('Params:', params); // Add logging

    const result = await query(queryText, params);
    
    if (!result || !result.rows) {
      console.log('No results found');
      return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
    }

    const jobs = result.rows.map((job) => {
      if (!job) return null;
      
      const keywords = scanKeywords(job.description || '');
      const remoteKeyword = job.location?.toLowerCase().includes('remote') ? 'Remote' : "";
      const salary = extractSalary(job.description || '');

      return {
        id: job.job_id,
        title: job.title || "",
        company: job.company || "",
        companyLogo: job.company ? `https://logo.clearbit.com/${encodeURIComponent(job.company.replace('.com', ''))}.com` : "/default.png",
        experienceLevel: job.experiencelevel || "",
        description: he.decode(job.description || ""),
        location: job.location || "",
        salary: salary || "N/A",
        postedDate: job.created_at ? job.created_at.toISOString() : "",
        remoteKeyword: remoteKeyword,
        keywords: keywords,
      };
    }).filter(Boolean); // Remove any null entries

    setCached(cacheKey, jobs);

    return new Response(JSON.stringify({ jobs }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error("Error fetching jobs by saved search:", error);
    return new Response(JSON.stringify({ 
      error: "Error fetching jobs by saved search",
      details: error.message 
    }), { status: 500 });
  }
}

export const dynamic = 'force-dynamic';