import { query } from "@/lib/pgdb";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company");
  const limit = parseInt(searchParams.get("limit")) || 3;

  if (!company) {
    return new Response(JSON.stringify({ error: "Company required" }), { status: 400 });
  }

  try {

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
      WHERE company = $1 
        AND deleted = false
      ORDER BY created_at DESC
      LIMIT $2`;

    const result = await query(similarQuery, [company, limit]);

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
    console.error("Error fetching similar company jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching similar company jobs" }), { status: 500 });
  }
}