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

    if (title) {
      queryText += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${title}%`);
      paramIndex++;
    }

    if (experienceLevel) {
      queryText += ` AND experiencelevel ILIKE $${paramIndex}`;
      params.push(`%${experienceLevel}%`);
      paramIndex++;
    }

    if (location) {
      queryText += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    queryText += `
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await query(queryText, params);

    const jobs = result.rows.map((job) => {
      const keywords = scanKeywords(job.description);
      const remoteKeyword = job.location.toLowerCase().includes('remote') ? 'Remote' : "";
      const salary = extractSalary(job.description);

      return {
        id: job.job_id,
        title: job.title || "",
        company: job.company || "",
        companyLogo: `https://logo.clearbit.com/${encodeURIComponent(job.company.replace('.com', ''))}.com`,
        experienceLevel: job.experiencelevel || "",
        description: he.decode(job.description || ""),
        location: job.location || "",
        salary: salary,
        postedDate: job.created_at ? job.created_at.toISOString() : "",
        remoteKeyword: remoteKeyword,
        keywords: keywords,
      };
    });

    setCached(cacheKey, jobs);

    return new Response(JSON.stringify({ jobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs by saved search:", error);
    return new Response(JSON.stringify({ error: "Error fetching jobs by saved search" }), { status: 500 });
  }
}

export const dynamic = 'force-dynamic';