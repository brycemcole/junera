import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Parse request body
    const rawBody = await req.text();
    let data;

    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON format", details: e.message },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Missing required fields", missingFields },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Begin transaction
    const transaction = pool.transaction();
    await transaction.begin();

    let companyId;

    try {
      // Step 1: Check if the company exists
      const existingCompany = await transaction.request()
        .input("name", company)
        .query(`
          SELECT id FROM companies WHERE name = @name;
        `);

      if (existingCompany.recordset.length > 0) {
        companyId = existingCompany.recordset[0].id;
      } else {
        // Step 2: Insert the company and retrieve the ID
        const newCompany = await transaction.request()
          .input("name", company)
          .query(`
            INSERT INTO companies (name)
            VALUES (@name);
            SELECT SCOPE_IDENTITY() AS id;
          `);

        companyId = newCompany.recordset[0].id;
      }

      if (!companyId) {
        throw new Error("Failed to retrieve or insert company ID.");
      }

      console.log("Company ID:", companyId);

      // Step 3: Check if the job posting exists
      const existingJob = await transaction.request()
        .input("link", source_url)
        .query(`
          SELECT id FROM jobPostings WHERE link = @link;
        `);

      if (existingJob.recordset.length > 0) {
        await transaction.rollback();
        return NextResponse.json(
          {
            success: false,
            message: "Similar job posting already exists",
            existingJobId: existingJob.recordset[0].id,
          },
          { status: 409 }
        );
      }

      // Step 4: Insert the job posting
      const newJob = await transaction.request()
        .input("title", title)
        .input("company_id", companyId)
        .input("location", location)
        .input("description", description)
        .input("link", source_url)
        .query(`
          INSERT INTO jobPostings (
            title, 
            company_id, 
            location, 
            link,
            description,
            postedDate,
            isProcessed
          )
          VALUES (
            @title, 
            @company_id, 
            @location, 
            @link,
            @description,
            GETDATE(),
            0
          );
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const jobId = newJob.recordset[0].id;

      // Commit transaction
      await transaction.commit();

      return NextResponse.json({
        success: true,
        jobId,
        message: "Job posting created successfully",
      });
    } catch (error) {
      console.error("Transaction error:", error);
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to create job posting", details: error.message },
      { status: 500 }
    );
  }
}