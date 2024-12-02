'use server';

import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { getCompanies } from "@/lib/companyCache";

export async function GET(req, { params }) {
  const { id } = await params;
  const authHeader = await req.headers.get('Authorization');
  
  console.log(authHeader);
  try {
    const timeout = 5000; // 5 seconds
    const jobPromise = getJobPostingById(id, authHeader);
    const bookmarkPromise = checkIfBookmarked(id, authHeader?.split(' ')[1]); // Check bookmark status

    let jobPosting = await jobPromise;

    const response = {
      jobPosting
    };

    // After fetching jobPosting
    const keywords = scanKeywords(jobPosting.description);
    const { salary, salary_max } = extractSalaryRange(jobPosting.description);
    response.keywords = keywords;
    jobPosting.salary = salary;
    jobPosting.salary_max = salary_max;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: error.name === 'QueryTimeout' ? 504 : 500 }
    );
  }
}

async function getJobPostingById(id, authHeader) {
  const pool = await getConnection();
  const companies = await getCompanies();
  let transaction = null;

  try {
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const request = transaction.request();
    request.timeout = 3000; // 3 second timeout for this specific query

    const result = await request
      .input("id", id)
      .query(`
        SELECT 
          j.id, j.title, j.location, j.description, j.views,
          j.salary, j.salary_range_str, j.experienceLevel,
          j.postedDate, j.company_id, j.applicants, j.link
        FROM jobPostings j
        WHERE j.id = @id
      `);


    await transaction.commit();
    
    let jobPosting = result.recordset[0];
    if (!jobPosting) {
      throw new Error('Job posting not found');
    }
    
    if (jobPosting.company_id) {
      const company = companies[jobPosting.company_id];
      jobPosting.companyName = company?.name || 'Unknown';
      jobPosting.companyLogo = company?.logo || null;
      jobPosting.companyDescription = company?.description || null; 
    }

    return jobPosting;
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
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