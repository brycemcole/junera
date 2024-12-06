import { createDatabaseConnection } from "@/lib/db";
import { getCompanies } from "@/lib/companyCache";
import { getCached, setCached } from '@/lib/cache';

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

  const cachedJobs = getCached('jobs-by-saved-search', { title, experienceLevel, location, company, limit });
  if (cachedJobs) {
    return new Response(JSON.stringify({ jobs: cachedJobs }), { status: 200 });
  }

  try {
    const [pool, companies] = await Promise.all([createDatabaseConnection(), getCompanies()]);

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

    // Consolidate parameters
    let params = {
      limit
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
        // No matching company found, return empty result
        return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
      }

      const companyId = companyResult.recordset[0].id;
      params.company_id = companyId;
    }

    const result = await pool.executeQuery(query, params);
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

    setCached('jobs-by-saved-search', { title, experienceLevel, location, company, limit }, jobs);
    
    return new Response(JSON.stringify({ jobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs by saved search:", error);
    return new Response(JSON.stringify({ error: "Error fetching jobs by saved search" }), { status: 500 });
  }
}