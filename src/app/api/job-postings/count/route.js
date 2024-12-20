import { query } from "@/lib/pgdb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract and sanitize search filters
    const title = searchParams.get("title")?.trim() || "";
    const experienceLevel = searchParams.get("experienceLevel")?.trim().toLowerCase() || "";
    const location = searchParams.get("location")?.trim() || "";
    const company = searchParams.get("company")?.trim() || "";

    // Prepare query parameters
    const params = [];
    let paramIndex = 1;

    // Build the count query
    let queryText = `
      SELECT COUNT(*) AS totalJobs
      FROM jobPostings
      WHERE 1 = 1
    `;

    // Full-text search on title_vector
    if (title) {
      queryText += ` AND title_vector @@ to_tsquery('english', $${paramIndex})`;
      params.push(title.trim().replace(/\s+/g, ' & '));
      paramIndex++;
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