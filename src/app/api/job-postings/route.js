// /pages/api/jobPostings.js (or your appropriate file)
import { getConnection } from "@/lib/db";
import sql from 'mssql';
import { getCompanies } from "@/lib/companyCache";
import { performance } from 'perf_hooks'; // Import the performance API

function formatSearchTerms(text) {
  if (!text) return '';
  const terms = text.trim().split(' ').filter(t => t);
  return terms.map(term => `"*${term}*"`).join(' AND ');
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("id");

  // Initialize an object to store timing information
  const timings = {};

  // Record the start time of the entire GET handler
  const overallStart = performance.now();

  // If jobId is provided, fetch single job posting
  if (jobId) {
    try {
      // Start timing for getting the DB connection
      const dbConnStart = performance.now();
      const pool = await getConnection();
      const dbConnEnd = performance.now();
      timings.getConnection = dbConnEnd - dbConnStart;

      // Start timing for fetching companies
      const companiesStart = performance.now();
      const companies = await getCompanies();
      const companiesEnd = performance.now();
      timings.getCompanies = companiesEnd - companiesStart;

      // Start timing for building and executing the query
      const queryStart = performance.now();
      const request = pool.request();
      request.input('id', sql.Int, parseInt(jobId));

      // Modified query to include keywords
      const query = `
        SELECT 
          jp.id, 
          jp.title, 
          jp.location, 
          jp.postedDate, 
          jp.salary,
          jp.salary_range_str,
          jp.experienceLevel,
          jp.company_id,
          jp.description,
          jp.keywords
        FROM jobPostings jp WITH (NOLOCK)
        WHERE jp.id = @id AND jp.deleted = 0
      `;

      const result = await request.query(query);
      const queryEnd = performance.now();
      timings.queryExecution = queryEnd - queryStart;

      if (result.recordset.length === 0) {
        const overallEnd = performance.now();
        timings.total = overallEnd - overallStart;
        return new Response(JSON.stringify({ error: "Job not found", timings }), { status: 404 });
      }

      const job = result.recordset[0];
      const companyInfo = companies[job.company_id] || { name: "Unknown", logo: null };

      const formattedJob = {
        id: job.id,
        title: job.title,
        company: companyInfo.name,
        experienceLevel: job.experienceLevel,
        location: job.location,
        salary: job.salary,
        salary_range_str: job.salary_range_str,
        logo: companyInfo.logo,
        postedDate: job.postedDate,
        description: job.description,
        keywords: job.keywords ? job.keywords.split(',').map(k => k.trim()) : [] // Convert comma-separated string to array
      };

      const overallEnd = performance.now();
      timings.total = overallEnd - overallStart;

      return new Response(JSON.stringify({ job: formattedJob, timings }), { status: 200 });
    } catch (error) {
      console.error("Error fetching job posting:", error);
      const overallEnd = performance.now();
      timings.total = overallEnd - overallStart;
      return new Response(JSON.stringify({ error: "Error fetching job posting", timings }), { status: 500 });
    }
  }

  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  // Extract and sanitize search filters
  const title = searchParams.get("title")?.trim() || "";
  const experienceLevel = searchParams.get("experienceLevel")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "";
  const company = searchParams.get("company")?.trim() || "";

  try {
    // Start timing for fetching companies
    const companiesStart = performance.now();
    const companies = await getCompanies();
    const companiesEnd = performance.now();
    timings.getCompanies = companiesEnd - companiesStart;

    // Start timing for getting the DB connection
    const dbConnStart = performance.now();
    const pool = await getConnection();
    const dbConnEnd = performance.now();
    timings.getConnection = dbConnEnd - dbConnStart;

    // Build the optimized search query without JOIN
    let query = `
      SELECT 
        jp.id, 
        jp.title, 
        jp.location, 
        jp.postedDate, 
        jp.salary,
        jp.salary_range_str,
        jp.experienceLevel,
        jp.company_id
      FROM jobPostings jp WITH (NOLOCK)
      WHERE jp.deleted = 0
    `;

    // Add filters
    if (title) query += ` AND CONTAINS(jp.title, @title)`;
    if (experienceLevel) query += ` AND jp.experienceLevel = @experienceLevel`;
    if (location) query += ` AND CONTAINS(jp.location, @location)`;
    if (company) query += ` AND jp.company_id = @company_id`; // Changed to company_id

    query += `
      ORDER BY 
        jp.postedDate DESC, jp.id
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    // Start timing for query preparation
    const queryPrepStart = performance.now();
    const request = pool.request();

    // Format search terms with OR conditions
    if (title) request.input('title', sql.NVarChar, formatSearchTerms(title));
    if (location) request.input('location', sql.NVarChar, formatSearchTerms(location));
    if (experienceLevel) request.input('experienceLevel', sql.NVarChar, experienceLevel);
    if (company) {
      // Assuming 'company' is the company name, find the corresponding ID
      const companyEntry = Object.entries(companies).find(
        ([id, details]) => details.name.toLowerCase() === company.toLowerCase()
      );
      if (companyEntry) {
        request.input('company_id', sql.Int, parseInt(companyEntry[0]));
      } else {
        // If company not found, return empty results
        const queryPrepEnd = performance.now();
        timings.queryPreparation = queryPrepEnd - queryPrepStart;
        const overallEnd = performance.now();
        timings.total = overallEnd - overallStart;
        return new Response(JSON.stringify({ jobPostings: [], timings }), { status: 200 });
      }
    }
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);
    const queryPrepEnd = performance.now();
    timings.queryPreparation = queryPrepEnd - queryPrepStart;

    // Start timing for executing the query
    const queryExecStart = performance.now();
    const result = await request.query(query);
    const queryExecEnd = performance.now();
    timings.queryExecution = queryExecEnd - queryExecStart;

    const jobPostings = result.recordset.map((job) => {
      const companyInfo = companies[job.company_id] || { name: "Unknown", logo: null };
      return {
        id: job.id,
        title: job.title,
        company: companyInfo.name,
        experienceLevel: job.experienceLevel,
        location: job.location,
        salary: job.salary,
        logo: companyInfo.logo,
        postedDate: job.postedDate,
      };
    });

    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;

    return new Response(JSON.stringify({ jobPostings, timings }), { status: 200 });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;
    return new Response(JSON.stringify({ error: "Error fetching job postings", timings }), { status: 500 });
  }
} 