import { getConnection } from "@/lib/db";
import sql from 'mssql';  // Add this import

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('searchTitle', sql.NVarChar, title.toLowerCase())
      .query(`
        SELECT related_title, weight
        FROM (
          SELECT synonym_title as related_title, weight
          FROM job_title_synonyms
          WHERE LOWER(primary_title) = @searchTitle
          UNION
          SELECT primary_title as related_title, weight
          FROM job_title_synonyms
          WHERE LOWER(synonym_title) = @searchTitle
        ) AS combined_titles;
      `);

    return new Response(JSON.stringify({ synonyms: result.recordset }), { status: 200 });
  } catch (error) {
    console.error("Error fetching synonyms:", error);
    return new Response(JSON.stringify({ error: "Error fetching synonyms" }), { status: 500 });
  }
}