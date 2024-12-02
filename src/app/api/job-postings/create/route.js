import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

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
  // Immediately respond with a success status to the client
  const response = NextResponse.json({ success: true, message: "Request received" });
  
  // Process the request asynchronously
  (async () => {
    try {
      // Parse request body
      const rawBody = await req.text();
      let data;

      try {
        data = JSON.parse(rawBody);
        console.log(data);
      } catch (e) {
        console.log(rawBody)
        console.error("Invalid JSON format:", e.message);
        return; // Log error and stop further processing
      }

      const { title, company, location, description, source_url } = data;

      // Validate required fields
      const missingFields = [];
      if (!title) missingFields.push("title");
      if (!company) missingFields.push("company");
      if (!location) missingFields.push("location");
      if (!description) missingFields.push("description");
      if (!source_url) missingFields.push("source_url");

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return; // Log error and stop further processing
      }

      const pool = await getConnection();
      
      try {
        // Set timeout for all requests
        pool.config.options.requestTimeout = TIMEOUT;

        // Check if company has too many failures
        const failureCheck = await executeWithRetry(async () => {
          return pool.request()
            .input("company", company)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM failedPostings WHERE company = @company)
              BEGIN
                CREATE TABLE IF NOT EXISTS failedPostings (
                  company varchar(255) PRIMARY KEY,
                  failures int DEFAULT 1
                );
                INSERT INTO failedPostings (company) VALUES (@company);
              END
              
              SELECT failures FROM failedPostings WHERE company = @company;
            `);
        });

        if (failureCheck.recordset[0]?.failures >= MAX_FAILURES) {
          // Remove all postings from this company
          await executeWithRetry(async () => {
            return pool.request()
              .input("company", company)
              .query(`
                DELETE FROM jobPostings WHERE company_id IN (
                  SELECT id FROM companies WHERE name = @company
                );
                DELETE FROM failedPostings WHERE company = @company;
              `);
          });
          console.log(`Removed all postings from ${company} due to excessive failures`);
          return;
        }

        // Atomic MERGE for company with retry
        const companyResult = await executeWithRetry(async () => {
          return pool.request()
            .input("name", company)
            .query(`

        console.log("Job posting processed successfully");
      } catch (error) {
        console.error("Database error:", error);
      }
    } catch (error) {
      console.error("Error processing request:", error);
    }
  })();

  return response; // Immediate success response to the client
}