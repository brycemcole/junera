
import { getConnection } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  
  const title = searchParams.get("title") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const location = searchParams.get("location") || "";
  const company = searchParams.get("company") || "";

  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        FORMAT(postedDate, 'yyyy-MM') as month,
        COUNT(*) as count
      FROM jobPostings jp
      WHERE 
        jp.title LIKE @title AND
        jp.experienceLevel LIKE @experienceLevel AND
        jp.location LIKE @location AND
        postedDate >= DATEADD(month, -6, GETDATE())
    `;

    if (company) {
      query += ` AND jp.company_id = @company`;
    }

    query += `
      GROUP BY FORMAT(postedDate, 'yyyy-MM')
      ORDER BY month ASC
    `;

    const request = pool.request()
      .input('title', `%${title}%`)
      .input('experienceLevel', `%${experienceLevel}%`)
      .input('location', `%${location}%`);
    
    if (company) {
      request.input('company', company);
    }

    const result = await request.query(query);

    const monthlyStats = result.recordset.map(row => ({
      month: row.month,
      count: row.count
    }));

    return new Response(JSON.stringify({ monthlyStats }), { status: 200 });
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return new Response(JSON.stringify({ error: "Error fetching monthly stats" }), { status: 500 });
  }
}