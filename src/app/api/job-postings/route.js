import { getConnection } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  // Extracting search filters from URL
  const title = searchParams.get("title") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const location = searchParams.get("location") || "";
  const company = searchParams.get("company") || "";

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
        jp.title LIKE @title AND
        jp.experienceLevel LIKE @experienceLevel AND
        jp.location LIKE @location 
        ${company ? `AND jp.company_id = @company` : ""}
      ORDER BY jp.postedDate DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const request = pool.request()
      .input('title', `%${title}%`)
      .input('experienceLevel', `%${experienceLevel}%`)
      .input('location', `%${location}%`)
      .input('offset', offset)
      .input('limit', limit);

    if (company) {
      request.input('company', company);
    }

    const result = await request.query(query);

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