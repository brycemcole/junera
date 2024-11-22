import { getConnection } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  // Extract and sanitize search filters
  const title = searchParams.get("title") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const location = searchParams.get("location") || "";
  const company = searchParams.get("company") || "";

  const sanitizedTitle = title && title.trim() ? `"${title.trim()}"` : null;

  try {
    const pool = await getConnection();
    const query = `
      SELECT 
        jp.id, 
        jp.title, 
        jp.location, 
        jp.postedDate, 
        jp.salary,
        jp.experienceLevel,
        c.name AS companyName,
        c.logo AS companyLogo
      FROM jobPostings jp
      INNER JOIN companies c ON jp.company_id = c.id
      WHERE 
        (${!title ? "1 = 1" : "CONTAINS(jp.title, @title)"}) AND
        (@experienceLevel IS NULL OR jp.experienceLevel LIKE '%' + @experienceLevel + '%') AND
        (@location IS NULL OR jp.location LIKE '%' + @location + '%') 
        ${company ? "AND jp.company_id = @company" : ""}
      ORDER BY jp.postedDate DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const result = await pool.request()
      .input('title', sanitizedTitle || null)
      .input('experienceLevel', experienceLevel || null)
      .input('location', location || null)
      .input('company', company || null)
      .input('offset', offset)
      .input('limit', limit)
      .query(query);

    const jobPostings = result.recordset.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.companyName,
      experienceLevel: job.experienceLevel,
      location: job.location,
      salary: job.salary,
      logo: job.companyLogo,
      postedDate: job.postedDate,
    }));

    return new Response(JSON.stringify({ jobPostings }), { status: 200 });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    return new Response(JSON.stringify({ error: "Error fetching job postings" }), { status: 500 });
  }
}