import { createDatabaseConnection } from "@/lib/db";
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

export async function GET(req) {
    try {
        const cachedCompanies = cache.get('companies');
        if (cachedCompanies) {
            return new Response(JSON.stringify(cachedCompanies), { status: 200 });
        }

        const db = await createDatabaseConnection();
        const result = await db.executeQuery(`
            SELECT 
                id, 
                name,
                logo
            FROM companies
            ORDER BY name ASC;
        `, {});

        const companies = result.recordset.map((company) => ({
            id: company.id,
            name: company.name,
            logo: company.logo, 
        }));

        cache.set('companies', companies);

        return new Response(JSON.stringify(companies), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies" }), { status: 500 });
    }
}
