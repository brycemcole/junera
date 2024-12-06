import { createDatabaseConnection } from "@/lib/db";
import { getCached, setCached } from '@/lib/cache'; // ...existing code...

// /api/companies/job-postings-count/[id]
// route to grab the amount of job postings for a company

export async function GET(req, { params }) {

    try {
        console.log("Fetching job postings count for company:", params.id); 
        const companyId = await params.id;

        const cachedJobPostingsCount = getCached('job-postings-count', companyId);
        if (cachedJobPostingsCount) {
            return new Response(JSON.stringify({ jobPostingsCount: cachedJobPostingsCount }), { status: 200 });
        }
        const db = await createDatabaseConnection();
        const result = await db.executeQuery(`
            SELECT COUNT(*) AS jobPostingsCount
            FROM jobPostings jp WITH (NOLOCK)
            WHERE jp.company_id = @company_id;
        `, { company_id: companyId });
        
        const jobPostingsCount = result.recordset[0].jobPostingsCount;

        setCached('job-postings-count', companyId, jobPostingsCount);

        return new Response(JSON.stringify({ jobPostingsCount }), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}
