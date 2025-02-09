'use server';

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import * as React from 'react';
import { query } from "@/lib/pgdb";
import { scanKeywords } from '@/lib/job-utils';
const he = require('he');

function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Define regex patterns in order of priority
  const patterns = [
    // New pattern to match decimal hourly ranges without a suffix (e.g. "$30.94 - $47.77")
    /\$\s*(\d+(?:\.\d+)?)\s*[-–—]\s*\$\s*(\d+(?:\.\d+)?)/gi,
    // 1. Hourly rates (highest priority)
    /\$\s*(\d+\.?\d*)\s*(per\s*hour|hourly|per\s*hr|hr|h|\/ hour|\/hour|\/hr)\b/gi,

    // 2. Hourly ranges
    /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)/gi,

    // 3. Salary ranges with dashes
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 4. Salary ranges with 'to' wording
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 5. k-based salary ranges
    /\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k/gi,

    // 6. Monthly salaries
    /\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b/gi,

    // 7. Single salary mentions (lowest priority)
    /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi,
  ];

  // Find the first match in order of priority
  for (const pattern of patterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }

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
    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    if (!jobPosting.salary)
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
      data: jobPosting,
      keywords: scanKeywords(jobPosting.description),
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

// Simplified bookmark check
async function checkIfBookmarked(jobId, token) {
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);

    const result = await query(`
      SELECT 1 
      FROM user_interactions 
      WHERE user_id = $1 
      AND job_posting_id = $2 
      AND interaction_type = 'bookmark'
      LIMIT 1
    `, [decoded.id, jobId]);

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
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
