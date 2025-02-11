import { query } from "@/lib/pgdb";

export async function GET(req, { params }) {
  const { type } = await params;
  const urlSet = [];
  const baseUrl = 'https://junera.us';

  try {
    if (type === 'jobs') {
      // Get all job postings from the last 30 days
      const result = await query(`
        SELECT job_id, created_at, updated_at
        FROM jobPostings
        WHERE created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
      `);

      result.rows.forEach(job => {
        urlSet.push(`
          <url>
            <loc>${baseUrl}/job-postings/${job.job_id}</loc>
            <lastmod>${job.updated_at || job.created_at}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
          </url>
        `);
      });
    } else if (type === 'companies') {
      // Get all companies with active jobs
      const result = await query(`
        SELECT DISTINCT company, MAX(created_at) as latest_job
        FROM jobPostings
        GROUP BY company
        ORDER BY latest_job DESC
      `);

      result.rows.forEach(company => {
        urlSet.push(`
          <url>
            <loc>${baseUrl}/companies/${encodeURIComponent(company.company)}</loc>
            <lastmod>${company.latest_job}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
          </url>
        `);
      });
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urlSet.join('')}
      </urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}