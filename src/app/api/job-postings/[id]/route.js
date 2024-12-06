'use server';

import { NextResponse } from 'next/server';
import { createDatabaseConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { getCompanies } from "@/lib/companyCache";
import * as React from 'react';

export async function GET(req, { params }) {
  try {
    const id = await params.id;
    const [pool, companies] = await Promise.all([createDatabaseConnection(), getCompanies()]);

    // Get job posting details
    const result = await pool.executeQuery(`
      SELECT
        jp.* 
      FROM jobPostings jp WITH (NOLOCK)
      WHERE jp.id = @id
      `, { id });

    if (!result.recordset.length) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    let jobPosting = result.recordset[0];
    jobPosting.companyLogo = companies[jobPosting.company_id].logo;
    jobPosting.companyName = companies[jobPosting.company_id].name;
    console.log('Job Posting:', jobPosting);

    return NextResponse.json({
      success: true,
      data: jobPosting
    });

  } catch (error) {
    console.error('Error fetching job posting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job posting' },
      { status: 500 }
    );
  }
}

async function getRelatedJobPostings(jobPosting) {
  let job = await jobPosting;
  if (!job) return null;
  
  const pool = await getConnection();
  const request = pool.request();
  request.timeout = 2000; // 2 second timeout

  // Ensure title is not null or empty
  const title = job.title && job.title.trim() !== '' ? job.title.trim() : null;
  console.log('Related Postings - Title:', title);

  let similarPostings = [];
  let companyPostings = [];



  return {
    similarPostings: similarPostings.recordset || [],
    sameCompanyPostings: companyPostings.recordset || []
  };
}

// Moved to background task
async function trackUserView(pool, jobId, authHeader) {
  try {
    const token = await authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    
    await pool.request()
      .input('userId', sql.NVarChar, decoded.id)
      .input('jobId', sql.NVarChar, jobId)
      .query(`
        MERGE user_recent_viewed_jobs AS target
        USING (SELECT @userId as user_id, @jobId as jobPostings_id) AS source
        ON target.user_id = source.user_id AND target.jobPostings_id = source.jobPostings_id
        WHEN MATCHED THEN
          UPDATE SET viewed_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, jobPostings_id, viewed_at, company_id)
          VALUES (
            @userId, 
            @jobId, 
            GETDATE(),
            (SELECT company_id FROM jobPostings WHERE id = @jobId)
          );
      `);
  } catch (error) {
    console.error('Failed to track user view:', error);
  }
}

// Simplified bookmark check
async function checkIfBookmarked(jobId, token) {
  if (!token) return false;

  try {
    const pool = await getConnection();
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    
    const result = await pool.request()
      .input('userId', decoded.id)
      .input('jobId', jobId)
      .query(`
        SELECT TOP 1 1 
        FROM favorites_jobs 
        WHERE user_id = @userId AND job_posting_id = @jobId
      `);

    return result.recordset.length > 0;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
}

// Add the scanKeywords function
function scanKeywords(text) {
  const keywordsList = ['JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'Python', 'Java', 'SQL', 'C++', 'C#', 'Azure', 'Machine Learning', 'Artificial Intelligence', 'AWS', 'Rust', 'TypeScript', 'Angular', 'Vue.js', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps', 'GraphQL', 'RESTful', 'API', 'Microservices', 'Serverless', 'Firebase', 'MongoDB', 'PostgreSQL', 'MySQL', 'NoSQL', 'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Jenkins', 'Git', 'GitHub', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Trello', 'VSCode', 'IntelliJ', 'WebStorm', 'PyCharm', 'Eclipse', 'NetBeans', 'Visual Studio', 'Xcode', 'Android Studio'];
    const foundKeywords = keywordsList.filter(keyword => text.includes(keyword));
    return foundKeywords;
}

// Add a function to extract salary range from text
function extractSalaryRange(text) {
    const salaryRegex = /\$([\d,]+)\s*(?:to|\-)\s*\$([\d,]+)/;
    const match = text.match(salaryRegex);
    if (match) {
        const salary = parseInt(match[1].replace(/,/g, ''), 10);
        const salary_max = parseInt(match[2].replace(/,/g, ''), 10);
        console.log('Parsed salary:', salary, salary_max);
        return { salary, salary_max };
    }
    return { salary: null, salary_max: null };
}