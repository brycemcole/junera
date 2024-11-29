
import { getConnection } from "@/lib/db";
import sql from 'mssql';
import { getCompanies } from "@/lib/companyCache";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit")) || 3;

  if (!jobId) {
    return new Response(JSON.stringify({ error: "Job ID required" }), { status: 400 });
  }

  try {
    const pool = await getConnection();
    const companies = await getCompanies();
    
    const request = pool.request()
      .input('id', sql.Int, parseInt(jobId))
      .input('limit', sql.Int, limit);

    const query = `
      WITH SourceJob AS (
        SELECT title, experienceLevel, location
        FROM jobPostings WITH (NOLOCK)
        WHERE id = @id
      )
      SELECT TOP (@limit)
        jp.id, jp.title, jp.location, jp.postedDate, 
        jp.salary, jp.experienceLevel, jp.company_id
      FROM jobPostings jp WITH (NOLOCK)
      CROSS JOIN SourceJob sj
      WHERE jp.id != @id 
        AND jp.deleted = 0
        AND (
          jp.experienceLevel = sj.experienceLevel
          OR jp.location LIKE '%' + sj.location + '%'
        )
      ORDER BY jp.postedDate DESC`;

    const result = await request.query(query);

    const similarJobs = result.recordset.map(job => ({
      id: job.id,
      title: job.title,
      company: companies[job.company_id]?.name || "Unknown",
      experienceLevel: job.experienceLevel,
      location: job.location,
      salary: job.salary,
      logo: companies[job.company_id]?.logo || null,
      postedDate: job.postedDate
    }));

    return new Response(JSON.stringify({ similarJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching similar jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching similar jobs" }), { status: 500 });
  }
}