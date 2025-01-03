'use server';

import { NextResponse } from 'next/server';
import { createDatabaseConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { getCompanies } from "@/lib/companyCache";
import * as React from 'react';
import { query } from "@/lib/pgdb";
const he = require('he');

function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')       // Replace non-breaking spaces
    .replace(/&nbsp;/g, ' ')       // Replace &nbsp;
    .replace(/&mdash;/g, '—')      // Replace &mdash; with em-dash
    // .replace(/&amp;/g, '&')        // Replace &amp; with &
    .replace(/&lt;/g, '<')         // Replace &lt; with <
    .replace(/&gt;/g, '>')         // Replace &gt; with >
    .trim();

  // Define regex patterns
  const patterns = [
    // 1. Salary ranges with dashes (e.g., "$128,000—$152,000 USD")
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 2. Salary ranges with 'to' wording (e.g., "$35,000 to $45,000 per year")
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 3. k-based salary ranges (e.g., "$100k—$120k")
    /\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k/gi,

    // 4. Hourly ranges (e.g., "55/hr - 65/hr")
    /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)/gi,

    // 5. Monthly salaries with at least three digits (e.g., "$4200 monthly")
    /\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b/gi,

    // **6. Single salary mentions with 'per hour' or similar (e.g., "$35.00 per hour")**
    /\$\s*\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(per\s*hour|hourly|per\s*hr|hr|h)\b/gi,

    // 7. Single salary mentions (e.g., "$85,000")
    /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi,
  ];

  let matchesWithDollar = [];
  let matchesWithoutDollar = [];

  // Iterate through each pattern and collect matches
  for (const pattern of patterns) {
    const matches = Array.from(normalizedText.matchAll(pattern));
    for (const match of matches) {
      if (pattern.source.includes('\\$')) {
        // Patterns that require '$' are stored in matchesWithDollar
        matchesWithDollar.push({
          text: match[0].trim(),
          index: match.index
        });
      } else {
        // Patterns that do NOT require '$' are stored in matchesWithoutDollar
        matchesWithoutDollar.push({
          text: match[0].trim(),
          index: match.index
        });
      }
    }
  }

  // Function to find the match with the highest index
  const getLastMatch = (matches) => {
    return matches.reduce((prev, current) => {
      return (prev.index > current.index) ? prev : current;
    }, matches[0]);
  };

  // Prioritize matches with '$'
  if (matchesWithDollar.length > 0) {
    const lastMatch = getLastMatch(matchesWithDollar);
    return lastMatch.text;
  }
  // If no matches with '$', consider matches without '$'
  else if (matchesWithoutDollar.length > 0) {
    const lastMatch = getLastMatch(matchesWithoutDollar);
    return lastMatch.text;
  }

  // Return empty string if no matches found
  return "";
}

export async function GET(req, { params }) {
  params = await params;
  try {
    const id = params.id;
    const authHeader = req.headers.get('Authorization');

    // Get job posting details
    const result = await query(`
      SELECT
        jp.* 
      FROM jobPostings jp
      WHERE jp.job_id = $1;
    `, [id]);

    let jobPosting = result.rows[0];
    jobPosting.salary = extractSalary(jobPosting.description);

    // Track view if user is authenticated
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        // Update view count
        await query(`
          UPDATE jobPostings 
          SET views = COALESCE(views, 0) + 1 
          WHERE job_id = $1
        `, [id]);

        // Record user interaction
        await query(`
          INSERT INTO user_interactions (user_id, job_posting_id, interaction_type, interaction_date)
          VALUES ($1, $2, 'view', NOW())
          ON CONFLICT (user_id, job_posting_id, interaction_type) 
          DO UPDATE SET interaction_date = NOW()
        `, [userId, id]);

      } catch (error) {
        console.error('Error tracking view:', error);
        // Continue execution even if view tracking fails
      }
    }

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
