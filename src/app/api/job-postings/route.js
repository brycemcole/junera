import { getConnection } from "@/lib/db";
import sql from 'mssql';

// Add this helper function at the top
function formatForFullTextSearch(text) {
  return `"${text.replace(/"/g, '""')}"`;
}
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  try {
    const pool = await getConnection();

    const query = `
      SELECT 
        jp.id, 
        jp.title, 
        jp.location, 
        jp.postedDate, 
        jp.salary,
        c.name AS companyName,
        c.logo AS companyLogo
      FROM jobPostings jp
      INNER JOIN companies c ON jp.company_id = c.id
      ORDER BY 
        jp.id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const request = pool.request();
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const jobPostings = result.recordset.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.companyName,
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
