import { getConnection } from "@/lib/db";
import sql from "mssql";

// return an array of company links
export async function GET(req) {
    try {
        const pool = await getConnection();
        const result = await sql.query(`
            SELECT 
                link, id
            FROM JobPostings
            ORDER BY id ASC, link ASC;
        `);

        const companiesLinks = result.recordset.map((companyLink) => ({
            id: companyLink.id,
            link: companyLink.link,
        }));

        return new Response(JSON.stringify(companiesLinks), { status: 200 });
    } catch (error) {
        console.error("Error fetching companies links:", error);
        return new Response(JSON.stringify({ error: "Error fetching companies links" }), { status: 500 });
    }
}

