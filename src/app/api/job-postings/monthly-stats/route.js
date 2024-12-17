import { getConnection } from "@/lib/db";
import sql from 'mssql';

function formatForFullTextSearch(text) {
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const location = searchParams.get("location") || "";
  const company = searchParams.get("company") || "";

  try {
    const pool = await getConnection();
    let titleCondition = "1=1";
    let parameters = [];

    if (title && title.trim()) {
      const synonymsQuery = await pool.request()
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
            UNION
            SELECT @searchTitle as related_title, 1.0 as weight
          ) AS combined_titles;
        `);

      const synonyms = synonymsQuery.recordset;

      if (synonyms.length > 0) {
        titleCondition = `(${synonyms.map((syn, i) => `CONTAINS(jp.title, @title${i})`).join(' OR ')
          })`;

        synonyms.forEach((syn, i) => {
          parameters.push({
            name: `title${i}`,
            value: formatForFullTextSearch(syn.related_title)
          });
        });
      } else {
        titleCondition = "CONTAINS(jp.title, @title)";
        parameters.push({
          name: 'title',
          value: formatForFullTextSearch(title)
        });
      }
    }

    let query = `
      SELECT 
        FORMAT(postedDate, 'yyyy-MM') as month,
        COUNT(*) as count
      FROM jobPostings jp
      WHERE 
        postedDate >= DATEADD(month, -6, GETDATE()) AND
        ${titleCondition}
    `;

    if (experienceLevel) {
      query += ` AND jp.experienceLevel LIKE '%' + @experienceLevel + '%'`;
    }
    if (location) {
      query += ` AND jp.location LIKE '%' + @location + '%'`;
    }
    if (company) {
      query += ` AND jp.company_id = @company`;
    }

    query += `
      GROUP BY FORMAT(postedDate, 'yyyy-MM')
      ORDER BY month ASC
    `;

    const request = pool.request();

    // Add title parameters
    if (parameters.length > 0) {
      parameters.forEach(param => request.input(param.name, sql.NVarChar, param.value));
    }

    // Add other parameters
    if (experienceLevel) request.input('experienceLevel', sql.NVarChar, experienceLevel);
    if (location) request.input('location', sql.NVarChar, location);
    if (company) request.input('company', sql.NVarChar, company);

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

export const dynamic = 'force-dynamic';