import { query } from "@/lib/pgdb"; // Import the query method from pgdb
import { getCached, setCached } from '@/lib/cache'; // Import caching methods

// Simple hash function to generate a consistent integer from a string
function hashStringToInt(str) {
    if (!str) return 0; // Handle null or undefined strings gracefully
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

export async function GET(req) {
    const { signal } = req;

    console.log('Fetching companies...'); // Debug log  

    try {
        if (signal.aborted) {
            throw new Error('Request aborted');
        }

        // Fetch distinct, non-null companies from the jobPostings table
        const result = await query(`
SELECT company
FROM unique_companies
ORDER BY company ASC;

        `);

        // Log the raw result for debugging

        // Adjust based on your database client
        const rows = result.rows || result.recordset || [];

        // Map each company to an object with a unique ID and logo URL
        const companies = rows
            .map((row) => row.company) // Extract the company name
            .filter((company) => company) // Ensure company is not null or undefined
            .map((company) => ({
                id: hashStringToInt(company), // Generate unique integer ID
                name: company,
                logo: `https://logo.clearbit.com/${encodeURIComponent(company.replace('.com', ''))}.com`, // Generate logo URL
            }));


        // Cache the companies data for future requests
        //await setCached('companies', companies);

        return new Response(JSON.stringify(companies), { status: 200 });
    } catch (error) {
        if (error.message === 'Request aborted') {
            return new Response(JSON.stringify({ error: 'Request was aborted' }), { status: 499 });
        }
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}