// /lib/companyCache.js
import { createDatabaseConnection } from "@/lib/db";

let companyCache = [];
let lastFetched = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getCompanies() {
  const now = Date.now();
  
  // Refresh cache if expired
  if (now - lastFetched > CACHE_DURATION) {
    try {
      const db = await createDatabaseConnection();
      const query = `SELECT id, name, logo, description FROM companies WITH (NOLOCK);`;
      const result = await db.executeQuery(query, []);
      companyCache = result.recordset.reduce((acc, company) => {
        acc[company.id] = {
          name: company.name,
          logo: company.logo,
        };
        return acc;
      }, {});
      lastFetched = now;
      console.log("Company cache refreshed.");
    } catch (error) {
      console.error("Error fetching companies:", error);
      // keep old cache if fetch fails
    
    }
  }

  return companyCache;
}