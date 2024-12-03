
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
  const sinceDate = searchParams.get("sinceDate")?.trim() || "";

  if (!sinceDate) {
    return new Response(JSON.stringify({ error: "sinceDate parameter is required" }), { status: 400 });
  }

  try {
    const pool = await getConnection();

    // Build the count query without JOIN
    let query = `
      SELECT 
        COUNT(jp.id) AS totalJobs
      FROM jobPostings jp WITH (NOLOCK)
      WHERE jp.deleted = 0 AND jp.postedDate >= @sinceDate
    `;

    if (title) query += ` AND FREETEXT(jp.title, @title)`;
    if (experienceLevel) query += ` AND jp.experienceLevel = @experienceLevel`;
    if (location) query += ` AND CONTAINS(jp.location, @location)`;
    if (company) query += ` AND jp.company_id = @company_id`;

    const request = pool.request();

    // Add parameters with proper formatting for full-text search
    request.input('sinceDate', sql.DateTime, new Date(sinceDate));
    if (title) request.input('title', sql.NVarChar, formatForFullTextSearch(title));
    if (location) request.input('location', sql.NVarChar, formatForFullTextSearch(location));
    if (experienceLevel) request.input('experienceLevel', sql.NVarChar, experienceLevel);
    if (company) {
      // If filtering by company, map company name to company_id
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