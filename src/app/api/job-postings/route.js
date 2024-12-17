// /pages/api/jobPostings.js

import { query } from "@/lib/pgdb"; // Import the query method from db.js
import { headers } from "next/headers";
import { performance } from 'perf_hooks';
const he = require('he');

// Utility function to scan keywords
function scanKeywords(text) {
  if (!text) return [];
  const keywordsList = [
    'JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'Python', 'Java', 'SQL', 'C++',
    'C#', 'Azure', 'Machine Learning', 'Artificial Intelligence', 'AWS', 'Rust',
    'TypeScript', 'Angular', 'Vue.js', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'GraphQL', 'RESTful', 'API', 'Microservices', 'Serverless', 'Firebase', 'MongoDB',
    'PostgreSQL', 'MySQL', 'NoSQL', 'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD',
    'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Jenkins', 'Git', 'GitHub',
    'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Trello', 'VSCode', 'IntelliJ',
    'WebStorm', 'PyCharm', 'Eclipse', 'NetBeans', 'Visual Studio', 'Xcode',
    'Android Studio', 'Unity', 'Unreal Engine', 'Blender', 'Maya', 'Photoshop',
    'Google Office', 'Microsoft office', 'Adobe Creative Suite', 'Figma', 'Sketch', 'Project Management', 'Excel', 'SaaS',
    'PaaS', 'IaaS', 'NFT', 'Blockchain', 'Cryptocurrency', 'Web3', 'Solidity', 'Rust', 'Golang', 'Ruby', 'Scala', 'Kotlin',
    'Swift', 'Objective-C', 'Flutter', 'React Native', 'Ionic', 'Xamarin', 'PhoneGap', 'Cordova', 'NativeScript', 'Electron', 'Government Consulting',
    'Semiconductors', 'Aerospace', 'Defense', 'Healthcare', 'Finance', 'Banking', 'Insurance', 'Retail', 'E-commerce', 'Education', 'Transportation',
  ];

  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const lowerText = text.toLowerCase();
  return keywordsList.filter(keyword => {
    const escapedKeyword = escapeRegex(keyword.toLowerCase());
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'g');
    return regex.test(lowerText);
  });
}


// ### Updated Utility Function: Extract Salary ###
/**
 * Extracts salary information from a given text.
 * Handles various formats such as:
 * - 'USD $100,000-$200,000'
 * - '$100k-120k'
 * - '55/hr - 65/hr'
 * - '$4200 monthly'
 * - etc.
 *
 * @param {string} text - The text to extract salary from.
 * @returns {string} - The extracted salary string or an empty string if not found.
 */
function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  // Create a temporary DOM element to leverage the browser's HTML parser
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')       // Replace non-breaking spaces
    .replace(/&nbsp;/g, ' ')       // Replace &nbsp;
    .replace(/&mdash;/g, '—')      // Replace &mdash; with em-dash
    .replace(/&amp;/g, '&')        // Replace &amp; with &
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

    // 6. Single salary mentions (e.g., "$85,000")
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

// Add shared utility functions at the top of the file
export const processJobPostings = (jobs) => {
    return jobs.map((job) => {
        const keywords = scanKeywords(job.description);
        const remoteKeyword = job.location?.toLowerCase().includes('remote') ? 'Remote' : "";
        const salary = extractSalary(job.description);

        return {
            id: job.job_id,
            title: job.title || "",
            company: job.company || "",
            companyLogo: `https://logo.clearbit.com/${encodeURIComponent(job.company?.replace('.com', ''))}.com`,
            experienceLevel: job.experiencelevel || "",
            description: job.description || "",
            location: job.location || "",
            salary: salary,
            postedDate: job.created_at ? job.created_at.toISOString() : "",
            remoteKeyword: remoteKeyword,
            keywords: keywords,
        };
    });
};

export async function GET(req) {
  const url = req.url;
  const { searchParams } = new URL(url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  const title = searchParams.get("title")?.trim() || "";
  const location = searchParams.get("location")?.trim().toLowerCase() || "";
  const company = searchParams.get("company")?.trim() || "";
  const experienceLevel = searchParams.get("experienceLevel")?.trim().toLowerCase() || "";

  // 1. Define state name to abbreviation mapping
  const stateMap = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY'
  };

  // 2. Create reverse mapping: abbreviation to full state name
  const abbrMap = {};
  for (const [name, abbr] of Object.entries(stateMap)) {
    abbrMap[abbr.toLowerCase()] = name;
  }

  // 3. Generate search terms based on the input location
  let locationSearchTerms = [location];

  if (stateMap[location]) {
    // If the input is a full state name, add its abbreviation
    locationSearchTerms.push(stateMap[location].toLowerCase());
  } else if (abbrMap[location]) {
    // If the input is a state abbreviation, add its full name
    locationSearchTerms.push(abbrMap[location].toLowerCase());
  }

  const timings = {};
  const overallStart = performance.now();

  try {
    // Build query
    let queryText = `
      SELECT 
        id, 
        job_id,
        source_url,
        experiencelevel,
        title, 
        company, 
        location,
        description,
        created_at
      FROM jobPostings
      WHERE 1 = 1
    `;

    const params = [];
    const entryLevelIndicators = ['1 year of', 'graduate', 'entry level', 'junior'];
    const entryLevelTitleIndicators = ['new grad', 'college graduate', 'associate'];
    const exclusionIndicators = ['senior', 'manager', 'lead', 'director', 'principal', 'vice', 'vp', 'head'];
    let paramIndex = 1; // PostgreSQL uses 1-based indexing for parameters

    // Full-text search on title (using ILIKE for simplicity)
    if (title) {
      // Replace spaces with & for AND logic in to_tsquery
      const formattedTitle = title.trim().replace(/\s+/g, ' & ');
      queryText += ` AND to_tsvector('english', title) @@ to_tsquery('english', $${paramIndex})`;
      params.push(formattedTitle);
      paramIndex++;
    }

    if (experienceLevel) {
      // Existing logic for other experience levels
      queryText += ` AND experiencelevel ILIKE $${paramIndex}`;
      params.push(`%${experienceLevel}%`);
      paramIndex++;
    }

    // 4. Modify the location filter to include both full state names and abbreviations with precise matching
    if (location) {
      const locationConditions = [];
      const locationParams = [];

      locationSearchTerms.forEach(term => {
        // Check if the term is an abbreviation (length <= 2)
        if (term.length <= 2) {
          // Regex pattern to match whole word or preceded by a comma and/or space
          // Pattern explanation:
          // (^|,\s*)ny(\s*|$)
          const regexPattern = `(^|,\\s*)${term}(\\s*|$)`;
          locationConditions.push(`location ~* $${paramIndex}`);
          locationParams.push(regexPattern);
          paramIndex++;
        } else {
          // For full state names, use ILIKE with wildcards
          locationConditions.push(`location ILIKE $${paramIndex}`);
          locationParams.push(`%${term}%`);
          paramIndex++;
        }
      });

      // Combine conditions with OR
      queryText += ` AND (${locationConditions.join(' OR ')})`;

      // Add parameters
      params.push(...locationParams);
    }

    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    queryText += `
      ORDER BY 
        created_at DESC, id DESC, title, location
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    params.push(limit, offset);
    paramIndex += 2;

    const queryPrepStart = performance.now();
    const queryExecStart = performance.now();
    const result = await query(queryText, params);
    const queryExecEnd = performance.now();
    timings.queryExecution = queryExecEnd - queryExecStart;
    const queryPrepEnd = performance.now();
    timings.queryPreparation = queryPrepEnd - queryPrepStart;

    // Process results
    const jobPostings = processJobPostings(result.rows);

    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;

    return new Response(JSON.stringify({ jobPostings, timings }), { status: 200 });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;
    return new Response(JSON.stringify({ error: "Error fetching job postings", timings }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { jobId, summary } = await req.json();

    // Validate inputs
    if (!jobId || !summary) {
      return new Response(
        JSON.stringify({ error: "Job ID and summary are required" }),
        { status: 400 }
      );
    }

    // Update the job posting with the new summary
    const updateQuery = `
      UPDATE jobPostings 
      SET summary = $1 
      WHERE job_id = $2 
      RETURNING *`;

    const result = await query(updateQuery, [summary, jobId]);

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Job posting not found" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result.rows[0]
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating job posting:", error);
    return new Response(
      JSON.stringify({ error: "Error updating job posting" }),
      { status: 500 }
    );
  }
}