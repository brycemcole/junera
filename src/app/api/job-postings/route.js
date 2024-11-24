import { getConnection } from "@/lib/db";
import sql from 'mssql';

// Add this helper function at the top
function formatForFullTextSearch(text) {
  // Handle phrases by wrapping them in double quotes
  // and escaping any existing quotes
  return `"${text.replace(/"/g, '""')}"`;
}

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
    
    // If there's a title search, get synonyms
    let titleCondition = "1=1";
    let parameters = [];
    
    if (title && title.trim()) {  // Only get synonyms if title is not empty
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
        titleCondition = `(${
          synonyms.map((syn, i) => `
            CONTAINS(jp.title, @title${i})
          `).join(' OR ')
        })`;
        
        // Format each synonym for full-text search
        synonyms.forEach((syn, i) => {
          parameters.push({ 
            name: `title${i}`, 
            value: formatForFullTextSearch(syn.related_title),
            weight: syn.weight 
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

    const query = `
      SELECT 
        jp.id, 
        jp.title, 
        jp.location, 
        jp.postedDate, 
        jp.salary,
        jp.salary_string,
        jp.experienceLevel,
        c.name AS companyName,
        c.logo AS companyLogo
      FROM jobPostings jp
      INNER JOIN companies c ON jp.company_id = c.id
      WHERE 
        ${titleCondition} AND
        (@experienceLevel IS NULL OR jp.experienceLevel LIKE '%' + @experienceLevel + '%') AND
        (@location IS NULL OR jp.location LIKE '%' + @location + '%') 
        ${company ? "AND jp.company_id = @company" : ""}
      ORDER BY 
        ${parameters.length > 0 ? `
          CASE 
            ${parameters.map((p, i) => `
              WHEN CONTAINS(jp.title, @title${i}) THEN ${10 - (i * p.weight)}
            `).join('\n')}
            ELSE 100 
          END,
        ` : ''}
        jp.postedDate DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const request = pool.request();
    
    // Only add title parameters if we have them
    if (parameters.length > 0) {
      parameters.forEach(param => request.input(param.name, sql.NVarChar, param.value));
    }

    // Add other parameters
    request
      .input('experienceLevel', sql.NVarChar, experienceLevel || null)
      .input('location', sql.NVarChar, location || null)
      .input('company', sql.NVarChar, company || null)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit);

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