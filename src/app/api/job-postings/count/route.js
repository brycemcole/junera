// /pages/api/jobPostingsCount.js (or your appropriate file)
import { getConnection } from "@/lib/db";
import sql from 'mssql';

function formatForFullTextSearch(text) {
  // Escape double quotes for SQL
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Extract and sanitize search filters
  const title = searchParams.get("title")?.trim() || "";
  const experienceLevel = searchParams.get("experienceLevel")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "";
  const company = searchParams.get("company")?.trim() || "";

  try {
    const pool = await getConnection();

    // Build the count query without JOIN
    let query = `
      SELECT COUNT(*) AS totalJobs
      FROM jobPostings jp WITH (NOLOCK)
      WHERE jp.deleted = 0
    `;

    // Initialize an array to hold query conditions
    const conditions = [];

    if (title) conditions.push(`CONTAINS(jp.title, @title)`);
    if (experienceLevel) conditions.push(`jp.experienceLevel = @experienceLevel`);
    if (location) conditions.push(`CONTAINS(jp.location, @location)`);
    if (company) conditions.push(`jp.company_id = @company_id`); // We'll handle company_id later

    // Append conditions to the query
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    const request = pool.request();

    // Add parameters with proper formatting for full-text search
    if (title) request.input('title', sql.NVarChar, formatForFullTextSearch(title));
    if (location) request.input('location', sql.NVarChar, formatForFullTextSearch(location));
    if (experienceLevel) request.input('experienceLevel', sql.NVarChar, experienceLevel);
    if (company) {
      // If filtering by company, map company name to company_id
      // Assuming you have a cached companies object similar to the first optimization
      // For this example, we'll perform a separate query to get the company_id

      const companyQuery = `
        SELECT id FROM companies WITH (NOLOCK)
        WHERE LOWER(name) = LOWER(@companyName) AND deleted = 0
      `;
      const companyRequest = pool.request();
      companyRequest.input('companyName', sql.NVarChar, company);
      const companyResult = await companyRequest.query(companyQuery);

      if (companyResult.recordset.length === 0) {
        // No matching company found, return totalJobs as 0
        return new Response(JSON.stringify({ totalJobs: 0 }), { status: 200 });
      }

      const companyId = companyResult.recordset[0].id;
      request.input('company_id', sql.Int, companyId);
    }

    const result = await request.query(query);
    const totalJobs = result.recordset[0]?.totalJobs || 0;

    return new Response(JSON.stringify({ totalJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching total jobs" }), { status: 500 });
  }
}