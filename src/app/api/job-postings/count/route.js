import { query } from "@/lib/pgdb";
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
import { getCached, setCached } from '@/lib/cache';

export async function GET(req) {
  const { signal } = req;
  const url = req.url;
  const { searchParams } = new URL(url);

  // Create cache key from search params
  const cacheKey = `jobCount:${searchParams.toString()}`;

  try {
    // Check cache first
    const cachedCount = await getCached(cacheKey);
    if (cachedCount) {
      return Response.json({ count: parseInt(cachedCount), ok: true }, { status: 200 });
    }

    // Extract query params
    let title = (searchParams.get("title") || "").trim();
    let location = (searchParams.get("location") || "").trim().toLowerCase();
    const company = (searchParams.get("company") || "").trim();
    let experienceLevel = (searchParams.get("experienceLevel") || "").trim().toLowerCase();

    // Get title group if title provided
    let titleGroup = title ? findJobTitleGroup(title) : [];

    // Use materialized view or indexed subquery for faster counting
    let queryText = `
      SELECT COUNT(*) OVER() as total_count 
      FROM jobPostings 
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    // Add filters using the same logic as the main route
    if (titleGroup.length > 0) {
      const titleConditions = titleGroup.map((t, i) => {
        const idx = paramIndex + i;
        return `title_vector @@ to_tsquery('english', $${idx})`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
      params.push(...titleGroup.map(t => t.trim().replace(/\s+/g, ' & ')));
      paramIndex += titleGroup.length;
    }

    if (location) {
      queryText += ` AND location_vector @@ to_tsquery('simple', $${paramIndex})`;
      params.push(location.replace(/\s+/g, ' & '));
      paramIndex++;
    }

    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    if (experienceLevel) {
      queryText += ` AND LOWER(experiencelevel) = $${paramIndex}`;
      params.push(experienceLevel);
    }

    // Optimize by limiting to 1 row since we just need the count
    queryText += ` LIMIT 1`;

    // Execute query
    const result = await query(queryText, params);
    const count = parseInt(result.rows[0]?.total_count || 0);

    // Cache the count for 5 minutes
    await setCached(cacheKey, count, 300);

    return Response.json({ count, ok: true }, { status: 200 });

  } catch (error) {
    if (error.message === 'Request aborted') {
      return Response.json({ error: 'Request was aborted', ok: false }, { status: 499 });
    }
    console.error("Error fetching job posting count:", error);
    return Response.json({ error: "Error fetching job posting count", ok: false }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
