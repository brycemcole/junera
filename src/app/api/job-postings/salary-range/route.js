import { query } from "@/lib/pgdb";  // Updated import for the query function

export async function GET(req) {
  const { signal } = req;
  const url = req.url;
  const { searchParams } = new URL(url);
  
  // Build base query with a WHERE clause that always evaluates to true
  let queryText = `
    SELECT MIN(salary) AS min_salary, MAX(salary) AS max_salary
    FROM jobPostings
    WHERE 1=1
  `;
  let params = [];
  let paramIndex = 1;

  // Example filter: title
  const title = (searchParams.get("title") || "").trim();
  if (title) {
    queryText += ` AND title ILIKE $${paramIndex++}`;
    params.push(`%${title}%`);
  }

  // Example filter: location
  const location = (searchParams.get("location") || "").trim();
  if (location) {
    queryText += ` AND location ILIKE $${paramIndex++}`;
    params.push(`%${location}%`);
  }

  // ... add additional filters if needed (experienceLevel, company, etc.) ...

  try {
    const result = await query(queryText, params, { signal });
    const { min_salary, max_salary } = result.rows[0] || {};
    return Response.json({ min_salary, max_salary, ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error fetching salary range:", error);
    return Response.json({ error: "Error fetching salary range", ok: false }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
