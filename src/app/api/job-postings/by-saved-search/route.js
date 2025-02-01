import { query } from "@/lib/pgdb";
import { getCached, setCached } from '@/lib/cache';
const he = require('he');

function scanKeywords(text) {
  // ...existing code...
}

function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Define regex patterns in order of priority
  const patterns = [
    // New pattern to match decimal hourly ranges without a suffix (e.g. "$30.94 - $47.77")
    /\$\s*(\d+(?:\.\d+)?)\s*[-–—]\s*\$\s*(\d+(?:\.\d+)?)/gi,
    // 1. Hourly rates (highest priority)
    /\$\s*(\d+\.?\d*)\s*(per\s*hour|hourly|per\s*hr|hr|h|\/ hour|\/hour|\/hr)\b/gi,

    // 2. Hourly ranges
    /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)/gi,

    // 3. Salary ranges with dashes
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 4. Salary ranges with 'to' wording
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 5. k-based salary ranges
    /\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k/gi,

    // 6. Monthly salaries
    /\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b/gi,

    // 7. Single salary mentions (lowest priority)
    /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi,
  ];

  // Find the first match in order of priority
  for (const pattern of patterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }

  return "";
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