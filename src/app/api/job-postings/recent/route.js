import { createDatabaseConnection } from "@/lib/db";
import sql from 'mssql';
import { getCached, setCached } from '@/lib/cache'; // ...existing code...

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


  const cachedRecentJobsCount = getCached('recent-jobs-count', { title, experienceLevel, location, company, sinceDate });
  if (cachedRecentJobsCount) {
    return new Response(JSON.stringify({ totalJobs: cachedRecentJobsCount }), { status: 200 });
  }

  if (!sinceDate) {
    return new Response(JSON.stringify({ error: "sinceDate parameter is required" }), { status: 400 });
  }

  try {
    const pool = await createDatabaseConnection();

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

    // Consolidate parameters
    let params = {
      sinceDate: new Date(sinceDate),
    };

    if (title) params.title = formatForFullTextSearch(title);
    if (experienceLevel) params.experienceLevel = experienceLevel;
    if (location) params.location = formatForFullTextSearch(location);
    if (company) {
      // If filtering by company, map company name to company_id
      const companyResult = await pool.executeQuery(`
        SELECT id FROM companies WITH (NOLOCK)
        WHERE LOWER(name) = LOWER(@companyName) AND deleted = 0
      `, { companyName: company });

      if (companyResult.recordset.length === 0) {
        // No matching company found, return totalJobs as 0
        return new Response(JSON.stringify({ totalJobs: 0 }), { status: 200 });
      }

      const companyId = companyResult.recordset[0].id;
      params.company_id = companyId;
    }

    const result = await pool.executeQuery(query, params);
    const totalJobs = result.recordset[0]?.totalJobs || 0;

    setCached('recent-jobs-count', { title, experienceLevel, location, company, sinceDate }, totalJobs);

    return new Response(JSON.stringify({ totalJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching total jobs" }), { status: 500 });
  }
}