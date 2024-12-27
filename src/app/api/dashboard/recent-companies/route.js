import { query } from "@/lib/pgdb";

export async function GET(req) {
  try {
    const result = await query(`
      SELECT DISTINCT company, COUNT(*) as job_count 
      FROM jobPostings 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY company 
      ORDER BY job_count DESC 
      LIMIT 10
    `);

    return new Response(JSON.stringify({ companies: result.rows }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
