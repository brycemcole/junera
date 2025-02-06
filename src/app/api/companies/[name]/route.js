import { query } from "@/lib/pgdb";
import { NextResponse } from 'next/server';
const he = require('he');

function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Define regex patterns in order of priority
  const patterns = [
    // New pattern to match decimal hourly ranges without a suffix (e.g. "$30.94 - $47.77")
    /\$\s*(\d+(?:\.\d+)?)\s*[-–—]\s*\$\s*(\d+(?:\.\d+)?)/gi,
    // 1. Hourly rates (highest priority)
    /\$\s*(\d+\.?\d*)\s*(per\s*hour|hourly|per\s*hr|hr|h|\/ hour|\/hour|\/hr)\b/gi,

    // 2. Hourly ranges
    /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)/gi,

    // 3. Salary ranges with dashes
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 4. Salary ranges with 'to' wording
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 5. k-based salary ranges
    /\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k/gi,

    // 6. Monthly salaries
    /\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b/gi,

    // 7. Single salary mentions (lowest priority)
    /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi,
  ];

  // Find the first match in order of priority
  for (const pattern of patterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }

  return "";
}

const processJobPostings = (jobs) => {
  return jobs.map((job) => {
    const salary = extractSalary(job.description || "");

    return {
      id: job.job_id || "",
      title: job.title || "",
      company: job.company || "",
      companyLogo: job.company ? `https://logo.clearbit.com/${encodeURIComponent(job.company.replace('.com', ''))}.com` : "",
      experienceLevel: job.experiencelevel || "",
      summary: job.summary || "",
      description: job.description || "",
      location: job.location || "",
      salary: salary || "",
      postedDate: job.created_at ? job.created_at.toISOString() : "",
    };
  });
};

export async function GET(req, { params }) {
  const companyName = decodeURIComponent(params.name);
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 30;
  const offset = (page - 1) * limit;

  try {
    // 1) First, check if a row exists in the `companies` table:
    let companyResult = await query(
      `
        SELECT id, company_name, hiring_url, hiring_url2, hiring_url3
        FROM companies
        WHERE company_name = $1
      `,
      [companyName]
    );

    let companyRow = companyResult.rows.length > 0 ? companyResult.rows[0] : null;

    // 2) Check if there are job postings for the given name:
    const postingsResult = await query(
      `
        SELECT DISTINCT company
        FROM jobPostings
        WHERE company = $1
      `,
      [companyName]
    );

    const hasJobPostings = postingsResult.rows.length > 0;

    // 3) If the company does not exist in `companies` but has job postings, create a row:
    if (!companyRow && hasJobPostings) {
      const insertResult = await query(
        `
          INSERT INTO companies (company_name)
          VALUES ($1)
          RETURNING id, company_name, hiring_url, hiring_url2, hiring_url3
        `,
        [companyName]
      );
      companyRow = insertResult.rows[0];
    }

    // If we have job postings, fetch and paginate them
    let jobPostings = [];
    let total = 0;
    let totalPages = 0;

    if (hasJobPostings) {
      // Get paginated job postings using the actual name
      const jobPostingsResult = await query(
        `
          SELECT 
              job_id,
              title,
              company,
              location,
              description,
              experiencelevel,
              created_at,
              source_url,
              views,
              summary
          FROM jobPostings
          WHERE company = $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `,
        [companyName, limit, offset]
      );

      jobPostings = jobPostingsResult.rows;

      // Get total count for pagination
      const countResult = await query(
        `
          SELECT COUNT(*) as total
          FROM jobPostings
          WHERE company = $1
        `,
        [companyName]
      );
      total = parseInt(countResult.rows[0].total, 10);
      totalPages = Math.ceil(total / limit);
    }

    // 4) Construct the `company` object to return
    //    - If companyRow exists, spread it in; else just create a basic object
    const company = companyRow
      ? {
        ...companyRow,
        logo: `https://logo.clearbit.com/${encodeURIComponent(
          companyRow.company_name.replace(/\s+/g, '').toLowerCase()
        )}.com`,
      }
      : {
        company_name: companyName,
        logo: `https://logo.clearbit.com/${encodeURIComponent(
          companyName.replace(/\s+/g, '').toLowerCase()
        )}.com`,
      };

    return NextResponse.json({
      success: true,
      company,
      jobPostings: processJobPostings(jobPostings),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching company details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch company details',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
