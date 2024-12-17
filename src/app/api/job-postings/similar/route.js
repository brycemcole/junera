import { query } from "@/lib/pgdb";
import { getCompanies } from "@/lib/companyCache";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit")) || 3;

  if (!jobId) {
    return new Response(JSON.stringify({ error: "Job ID required" }), { status: 400 });
  }

  try {
    const companies = await getCompanies();

    // Get source job details first
    const sourceQuery = `
      SELECT title, experiencelevel, location
      FROM jobpostings 
      WHERE job_id = $1`;

    const sourceResult = await query(sourceQuery, [jobId]);

    if (sourceResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
    }

    const sourceJob = sourceResult.rows[0];

    // Get similar jobs
    const similarQuery = `
      SELECT 
        job_id as id,
        title,
        location,
        created_at as "postedDate",
        company,
        salary,
        experiencelevel,
      FROM jobpostings
      WHERE job_id != $1 
        AND deleted = false
        AND (
          experiencelevel = $2
          OR location ILIKE '%' || $3 || '%'
        )
      ORDER BY created_at DESC
      LIMIT $4`;

    const result = await query(similarQuery, [
      jobId,
      sourceJob.experiencelevel,
      sourceJob.location,
      limit
    ]);

    const similarJobs = result.rows.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company || "Unknown",
      experienceLevel: job.experiencelevel,
      location: job.location,
      salary: job.salary,
      logo: 'null',
      postedDate: job.postedDate
    }));

    return new Response(JSON.stringify({ similarJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching similar jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching similar jobs" }), { status: 500 });
  }
}