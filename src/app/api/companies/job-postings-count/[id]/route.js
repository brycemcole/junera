import { createDatabaseConnection } from "@/lib/db";
import { getCached, setCached } from '@/lib/cache'; // ...existing code...
import { query } from "@/lib/pgdb"; // Import the query method from db.js

// /api/companies/job-postings-count/[id]
// route to grab the amount of job postings for a company

export async function GET(req, { params }) {

    try {
        console.log("Fetching job postings count for company:", params.id);
        const companyName = await params.id;

        const cachedJobPostingsCount = getCached('job-postings-count', companyName);
        if (cachedJobPostingsCount) {
            return new Response(JSON.stringify({ jobPostingsCount: cachedJobPostingsCount }), { status: 200 });
        }
        const result = await query(`
            SELECT COUNT(*)
            FROM jobPostings jp
            WHERE jp.company = $1;
        `, [companyName]);

        const jobPostingsCount = result.rows[0].count;

        setCached('job-postings-count', companyName, jobPostingsCount);

        return new Response(JSON.stringify({ jobPostingsCount }), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}

export const dynamic = 'force-dynamic';