import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import sql from "mssql";

const MAX_RETRIES = 3;
const TIMEOUT = 30000; // 30 seconds
const MAX_FAILURES = 10;

async function executeWithRetry(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1 || !error.code?.includes('TIMEOUT')) throw error;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export async function POST(req) {
  // Immediate success response to the client
  const response = NextResponse.json({
    success: true,
    message: "Request received. Processing in the background.",
  });

  // Process the request asynchronously
  (async () => {
    try {
      const rawBody = await req.text();
      let data;

      // Parse the JSON body
      try {
        data = JSON.parse(rawBody);
        console.log("Received data:", data);
      } catch (e) {
        console.error("Invalid JSON format:", e.message);
        return; // Stop further processing
      }

      // Destructure required fields
      const { title, company, location, description, source_url } = data;

      // Validate required fields
      const missingFields = [];
      if (!title) missingFields.push("title");
      if (!company) missingFields.push("company");
      if (!location) missingFields.push("location");
      if (!description) missingFields.push("description");
      if (!source_url) missingFields.push("link");

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return; // Stop further processing
      }

      let companyId;

      try {
        // get the company id from db
        const result = await sql.query`
        SELECT id FROM companies WHERE CONTAINS(name, ${company})
      `;

        if (result.recordset.length === 0) {
          console.error("Company not found:", company);
          
          // Add the company to the database
          const insertCompanyResult = await sql.query`
          DECLARE @InsertedCompanies TABLE (id INT);

          INSERT INTO companies (name) 
          OUTPUT INSERTED.id INTO @InsertedCompanies
          VALUES (${company});
          SELECT id FROM @InsertedCompanies;

        `;

          companyId = insertCompanyResult.recordset[0].id;
          console.log("Company added successfully:", company);
        } else {
          companyId = result.recordset[0].id;
        }
      } catch (error) {
        console.error("Database error:", error);
        return; // Stop further processing
      }

      try {
        const result = await sql.query`
        DECLARE @InsertedJobPostings TABLE (id INT);
      
        INSERT INTO JobPostings (
          title,
          description,
          location,
          company_id,
          link
        )
        OUTPUT INSERTED.id INTO @InsertedJobPostings
        VALUES (
          ${title},
          ${description},
          ${location},
          ${companyId},
          ${source_url}
        );
      
        SELECT id FROM @InsertedJobPostings;
      `;
      
        const jobPostingId = result.recordset[0].id;
        console.log("Job posting added successfully:", jobPostingId);
      } catch (error) {
        console.error("Database error:", error);
        return; // Stop further processing
      }
    } catch (error) {
      console.error("Error processing request:", error);
    }
  })();

  return response;
}

export const dynamic = 'force-dynamic';