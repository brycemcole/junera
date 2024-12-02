
import { getConnection } from "@/lib/db";
import { getCompanies } from "@/lib/companyCache";

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
  const limit = parseInt(searchParams.get("limit")) || 10;

  try {
    const [pool, companies] = await Promise.all([getConnection(), getCompanies()]);

    // Build the query to fetch job postings
    let query = `
      SELECT 
        jp.id, jp.title, jp.experienceLevel, jp.location, jp.company_id, jp.postedDate
      FROM jobPostings jp WITH (NOLOCK)
      WHERE jp.deleted = 0
    `;

    if (title) query += ` AND FREETEXT(jp.title, @title)`;
    if (experienceLevel) query += ` AND jp.experienceLevel = @experienceLevel`;
    if (location) query += ` AND CONTAINS(jp.location, @location)`;
    if (company) query += ` AND jp.company_id = @company_id`;

    query += ` ORDER BY jp.postedDate DESC OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;

    const request = pool.request();

    // Add parameters with proper formatting for full-text search
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
        // No matching company found, return empty result
        return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
      }

      const companyId = companyResult.recordset[0].id;
      request.input('company_id', sql.Int, companyId);
    }

    request.input('limit', sql.Int, limit);

    const result = await request.query(query);
    let jobs = result.recordset;

    // Add company name to each job posting
    jobs = jobs.map(job => {
      const company = companies[job.company_id];
      return {
        ...job,
        companyName: company ? company.name : "Unknown",
        companyLogo: company ? company.logo : null,
      };
    });

    return new Response(JSON.stringify({ jobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs by saved search:", error);
    return new Response(JSON.stringify({ error: "Error fetching jobs by saved search" }), { status: 500 });
  }
}