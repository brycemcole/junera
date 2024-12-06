import { getConnection } from "@/lib/db";

export async function GET(req) {
    try {
        const pool = await getConnection();
        const result = await pool.executeQuery(`
            SELECT 
                id, 
                name
            FROM companies
            ORDER BY name ASC;
        `, {});

        const companies = result.recordset.map((company) => ({
            id: company.id,
            name: company.name,
        }));

        return new Response(JSON.stringify(companies), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}
