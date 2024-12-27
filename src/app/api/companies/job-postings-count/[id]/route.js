import { createDatabaseConnection } from "@/lib/db";
import { getCached, setCached } from '@/lib/cache';
import { query } from "@/lib/pgdb";

export async function GET(req, { params }) {
    params = await params;

    try {
        console.log("Fetching job postings count for company:", params.id);
        const companyName = params.id;

        // Wrap cache operations in try-catch
        try {
            const cacheKey = `job-postings-count:${companyName}`;
            const cachedJobPostingsCount = await getCached(cacheKey);
            if (cachedJobPostingsCount) {
                return new Response(JSON.stringify({ jobPostingsCount: cachedJobPostingsCount }), { status: 200 });
            }
        } catch (cacheError) {
            console.error("Cache retrieval error:", cacheError);
        }

        const result = await query(`
            SELECT COUNT(*)
            FROM jobPostings jp
            WHERE jp.company = $1;
        `, [companyName]);

        const jobPostingsCount = result.rows[0].count;

        // Wrap cache set operation in try-catch
        try {
            const cacheKey = `job-postings-count:${companyName}`;
            await setCached(cacheKey, jobPostingsCount);
        } catch (cacheError) {
            console.error("Cache set error:", cacheError);
        }

        return new Response(JSON.stringify({ jobPostingsCount }), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}

export const dynamic = 'force-dynamic';