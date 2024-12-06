import { createDatabaseConnection } from "@/lib/db";

// /api/companies/[id]
// route to get information about a company

export async function GET(req, { params }) {
    try {
        const companyId = await params.id;
        const db = await createDatabaseConnection();
        const result = await db.executeQuery(`
            SELECT 
                id, 
                name,
                logo
            FROM companies
            WHERE id = @company_id;
        `, { company_id: companyId });
            
        const companyResult = result.recordset[0];

        if (!companyResult) {
            return new Response(JSON.stringify({ error: "Company not found" }), { status: 404 });
        }

        const company = {
            id: companyResult.id,
            name: companyResult.name,
        };

        
        return new Response(JSON.stringify(company), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}
