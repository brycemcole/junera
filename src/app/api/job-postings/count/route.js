import { query } from "@/lib/pgdb";
import { findJobTitleGroup } from '@/lib/jobTitleMappings';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract and sanitize search filters
    const title = searchParams.get("title")?.trim() || "";
    const experienceLevel = searchParams.get("experienceLevel")?.trim().toLowerCase() || "";
    const location = searchParams.get("location")?.trim() || "";
    const company = searchParams.get("company")?.trim() || "";

    // Get the entire group of related titles if a title search is provided
    const titleGroup = title ? findJobTitleGroup(title) : [];

    // Prepare query parameters
    const params = [];
    let paramIndex = 1;

    // Build the count query
    let queryText = `
      SELECT COUNT(*) AS totalJobs
      FROM jobPostings
      WHERE 1 = 1
    `;

    // Full-text search on title_vector using title group
    if (title) {
      const titleConditions = titleGroup.map((t, i) => {
        const idx = paramIndex + i;
        return `title_vector @@ to_tsquery('english', $${idx})`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
      params.push(...titleGroup.map(t => t.trim().replace(/\s+/g, ' & ')));
      paramIndex += titleGroup.length;
    }

    // Experience level filter using LOWER
    if (experienceLevel) {
      queryText += ` AND LOWER(experiencelevel) = $${paramIndex}`;
      params.push(experienceLevel);
      paramIndex++;
    }

    // Location filter using location_vector
    if (location) {
      queryText += ` AND location_vector @@ plainto_tsquery('simple', $${paramIndex})`;
      params.push(location);
      paramIndex++;
    }

    // Company filter
    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    // Execute the query
    const result = await query(queryText, params);
    const totalJobs = result.rows[0]?.totaljobs || 0;

    return new Response(JSON.stringify({ totalJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching total jobs" }), { status: 500 });
  }
}