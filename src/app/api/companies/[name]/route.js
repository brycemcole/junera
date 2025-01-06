import { query } from "@/lib/pgdb";
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    const companyName = decodeURIComponent(params.name);
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
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
              job_id as id,
              title,
              company,
              location,
              description,
              experiencelevel as experience_level,
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
            jobPostings,
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
