import { getConnection } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  
  // Extracting search filters from URL
  const title = searchParams.get("title") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const location = searchParams.get("location") || "";
  const company = searchParams.get("company") || "";

  try {
    const pool = await getConnection();
    let query = `
      SELECT COUNT(*) AS totalJobs
      FROM jobPostings jp
      WHERE 
        jp.title LIKE @title AND
        jp.experienceLevel LIKE @experienceLevel AND
        jp.location LIKE @location 
    `;
    if (company) {
      query += ` AND jp.company_id = @company`;
    }

    const request = pool.request()
      .input('title', `%${title}%`)
      .input('experienceLevel', `%${experienceLevel}%`)
      .input('location', `%${location}%`);
    
    if (company) {
      request.input('company', company);
    }

    const result = await request.query(query);

    const totalJobs = result.recordset[0].totalJobs;

    return new Response(JSON.stringify({ totalJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching total jobs" }), { status: 500 });
  }
}