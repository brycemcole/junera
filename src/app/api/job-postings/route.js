// /pages/api/jobPostings.js

import { query } from "@/lib/pgdb"; // Import the query method from db.js
import { headers } from "next/headers";
import { performance } from 'perf_hooks';
const he = require('he');
import { getCached, setCached } from '@/lib/cache'; // Add this import
import { getRelatedTitles } from '@/lib/jobTitleMappings'; // Add this import
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

const stateMap = {
  'remote': 'N/A',
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
  'wyoming': 'WY',
};

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
// Add shared utility functions at the top of the file
const processJobPostings = (jobs) => {
  return jobs.map((job) => {
    const keywords = scanKeywords(job.description || "");
    const remoteKeyword = (job.location || "").toLowerCase().includes('remote') ? 'Remote' : "";
    const salary = extractSalary(job.description || "");

    return {
      id: job.job_id || "",
      title: job.title || "",
      company: job.company || "",
      companyLogo: job.company ? `https://logo.clearbit.com/${encodeURIComponent(job.company.replace('.com', ''))}.com` : "",
      experienceLevel: job.experiencelevel || "",
      summary: job.summary || "",
      description: "",
      location: job.location || "",
      salary: salary || "",
      postedDate: job.created_at ? job.created_at.toISOString() : "",
      remoteKeyword: remoteKeyword || "",
      keywords: keywords || [],
    };
  });
};

// Add query timeout error handling
const QUERY_TIMEOUT_MS = 10000;

// Add this function at the top
const executeQueryWithTimeout = async (queryText, params) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Query timeout'));
    }, QUERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      query(queryText, params),
      timeoutPromise
    ]);
  } catch (error) {
    if (error.message === 'Query timeout') {
      throw new Error('Query timed out');
    }
    throw error;
  }
};

export async function GET(req) {
  console.log('Fetching job postings...');
  const authHeader = req.headers.get('Authorization');
  let token = '';
  let user = null;
  let userPreferredTitles = [];
  let userPreferredLocations = [];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        if (!SECRET_KEY) {
          console.warn('SESSION_SECRET is not configured');
          return;
        }
        const decoded = jwt.verify(token, SECRET_KEY);
        user = decoded;
        userPreferredTitles = user.jobPrefsTitle || [];
        userPreferredLocations = user.jobPrefsLocation || [];
      } catch (error) {
        // Token verification failed, but we can continue without user preferences
        console.debug('Token verification failed:', error.message);
        user = null;
        userPreferredTitles = [];
        userPreferredLocations = [];
      }
    }
  }

  const { signal } = req;
  const url = req.url;
  const { searchParams } = new URL(url);

  // Pagination + strict
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const strictParam = searchParams.get("strictSearch");
  const strict = strictParam !== 'false'; // default true

  // New: Sort parameter
  const sortParam = searchParams.get("sort");
  const allowedSortValues = ['relevancy', 'recent'];
  const sort = allowedSortValues.includes(sortParam) ? sortParam : 'relevancy';

  if (page < 1) {
    return Response.json({ error: "Invalid page" }, { status: 400 });
  }
  if (limit > 50) {
    return Response.json({ error: "Limit exceeds maximum value" }, { status: 400 });
  }
  if (signal.aborted) {
    return Response.json({ error: 'Request was aborted' }, { status: 499 });
  }

  // Build offset
  const offset = (page - 1) * limit;

  // Extract query params
  let title = (searchParams.get("title") || "").trim();
  let location = (searchParams.get("location") || "").trim().toLowerCase();
  const company = (searchParams.get("company") || "").trim();
  let experienceLevel = (searchParams.get("experienceLevel") || "").trim().toLowerCase();
  if (experienceLevel === 'entry level') {
    experienceLevel = 'entry';
  }

  // Decide whether to apply user preferences as defaults
  const applyPrefsParam = searchParams.get('applyJobPrefs');
  let applyJobPrefs = false;
  if (user && (applyPrefsParam === 'true' || applyPrefsParam === null)) {
    applyJobPrefs = true;
  }

  // If we are applying user preferences and no explicit title/location is given, use them
  if (applyJobPrefs) {
    if (!title && userPreferredTitles.length > 0) {
      title = userPreferredTitles[0];
    }
    if (!location && userPreferredLocations.length > 0) {
      location = userPreferredLocations[0].toLowerCase();
    }
  } else {
    // Clear these if we’re NOT applying prefs
    userPreferredTitles = [];
    userPreferredLocations = [];
  }

  // ---------------------------
  // Build a combined TitleGroup
  // ---------------------------
  // This ensures we include synonyms (or "similar" job titles) for BOTH the typed title
  // *and* for the user’s preferred title(s).
  let allTitles = new Set();

  // If there’s a typed title, add it + its synonyms:
  if (title) {
    const typedTitleGroup = findJobTitleGroup(title);
    typedTitleGroup.forEach((t) => allTitles.add(t));
  }

  // Also, if user has preferred titles, add each plus synonyms:
  if (userPreferredTitles.length > 0) {
    userPreferredTitles.forEach((prefTitle) => {
      const prefGroup = findJobTitleGroup(prefTitle);
      prefGroup.forEach((t) => allTitles.add(t));
    });
  }

  // Convert set -> array
  const titleGroup = [...allTitles];
  // (If everything is empty, titleGroup will just be [])

  // State name -> abbreviation

  // Reverse map abbr -> full name
  const abbrMap = {};
  for (const [fullname, abbr] of Object.entries(stateMap)) {
    abbrMap[abbr.toLowerCase()] = fullname;
  }

  // Build location search terms
  let locationSearchTerms = [];
  if (location) {
    locationSearchTerms.push(location);

    // If user typed full state name, also add abbr
    if (stateMap[location]) {
      locationSearchTerms.push(stateMap[location].toLowerCase());
    }
    // If user typed abbr, add full name
    else if (abbrMap[location]) {
      locationSearchTerms.push(abbrMap[location].toLowerCase());
    }
  }

  // Prepare caching
  const cacheKey = `jobPostings:${searchParams.toString()}:prefs-${applyJobPrefs}:sort-${sort}`;
  const timings = {};
  const overallStart = performance.now();

  try {
    if (signal.aborted) {
      throw new Error('Request aborted');
    }

    // Create cache key based on search parameters
    const cacheKeyObject = {
      page,
      limit,
      title,
      location,
      company,
      experienceLevel,
      strict,
      sort,
      applyJobPrefs: applyJobPrefs ? true : false // don't include actual prefs in key
    };
    const cacheKeyString = JSON.stringify(cacheKeyObject);

    // Only use user-specific caching if we're applying job preferences
    const cacheKey = applyJobPrefs ? `${cacheKeyString}:user:${user?.id}` : cacheKeyString;

    // Check cache
    const cachedData = await getCached(cacheKey);
    if (cachedData) {
      console.log('Cache hit for key:', cacheKey);
      return Response.json(JSON.parse(cachedData), { status: 200 });
    }

    // For building query
    let params = [];
    let paramIndex = 1;
    let relevanceParams = []; // for TSQuery-based relevance
    let filterParams = [];    // for strict or non-strict filtering

    const hasSearchCriteria = !!(titleGroup.length || location || company || experienceLevel);

    // === Build SELECT + Relevance
    let queryText = `
      SELECT 
        job_id,
        title,
        company,
        description,
        location,
        experiencelevel,
        created_at,
        summary
    `;

    //
    // Always build a relevance column to weigh:
    //  - typed title => +2
    //  - preferred title => +1
    //  - typed location => +2
    //  - preferred location => +1
    //  - typed experience => +1
    //  - typed company => +1
    //
    {
      let relevanceCalculation = '(';

      // 1) Title Relevance
      //
      // Now that we've combined typed + user-preferred into titleGroup,
      // we can weigh the first item as typed with +2, and subsequent ones with +1 if you like.
      // Or keep it simpler and treat them all uniformly. 
      //
      // For demonstration, we’ll do:
      // - If there's an original typed `title`, give +2 for that exact text.
      // - For all the other titles in titleGroup (which might be synonyms or user prefs),
      //   assign +1. 
      //
      if (title) {
        // typed input => +2
        relevanceCalculation += ` (CASE WHEN title_vector @@ to_tsquery('english', $${paramIndex}) THEN 2 ELSE 0 END) +`;
        relevanceParams.push(title.trim().replace(/\s+/g, ' & '));
        paramIndex++;

        // The rest of the group are synonyms or user prefs
        let groupSynonyms = titleGroup.filter((g) => g !== title);
        if (groupSynonyms.length > 0) {
          const synonymsQuery = groupSynonyms
            .map((syn) => syn.trim().replace(/\s+/g, ' & '))
            .join(' | ');
          relevanceCalculation += ` (CASE WHEN title_vector @@ to_tsquery('english', $${paramIndex}) THEN 1 ELSE 0 END) +`;
          relevanceParams.push(synonymsQuery);
          paramIndex++;
        } else {
          relevanceCalculation += ` 0 +`;
        }
      } else {
        // No typed title => everything in titleGroup is a "preferred" or synonyms
        if (titleGroup.length > 0) {
          const synonymsQuery = titleGroup
            .map((syn) => syn.trim().replace(/\s+/g, ' & '))
            .join(' | ');
          relevanceCalculation += ` (CASE WHEN title_vector @@ to_tsquery('english', $${paramIndex}) THEN 1 ELSE 0 END) +`;
          relevanceParams.push(synonymsQuery);
          paramIndex++;
        } else {
          relevanceCalculation += ` 0 +`;
        }
      }

      // 2) Experience Level
      if (experienceLevel) {
        relevanceCalculation += ` (CASE WHEN LOWER(experiencelevel) = $${paramIndex} THEN 1 ELSE 0 END) +`;
        relevanceParams.push(experienceLevel);
        paramIndex++;
      } else {
        relevanceCalculation += ` 0 +`;
      }

      // 3) Location Relevance
      if (locationSearchTerms.length > 0) {
        // typed location => +2
        const tsquery = locationSearchTerms
          .map((term) =>
            term.includes(' ') ? term.split(' ').join(' & ') : term
          )
          .join(' | ');
        relevanceCalculation += ` (CASE WHEN location_vector @@ to_tsquery('simple', $${paramIndex}) THEN 2 ELSE 0 END) +`;
        relevanceParams.push(tsquery);
        paramIndex++;

        // plus userPreferredLocations => +1
        if (userPreferredLocations?.length > 0) {
          const preferredLocationsQuery = userPreferredLocations
            .map((loc) =>
              loc
                .toLowerCase()
                .split(/\s+/)
                .join(' & ')
            )
            .join(' | ');
          relevanceCalculation += ` (CASE WHEN location_vector @@ to_tsquery('simple', $${paramIndex}) THEN 1 ELSE 0 END) +`;
          relevanceParams.push(preferredLocationsQuery);
          paramIndex++;
        } else {
          relevanceCalculation += ` 0 +`;
        }
      } else {
        // no typed location => only userPreferredLocations
        if (userPreferredLocations?.length > 0) {
          const preferredLocationsQuery = userPreferredLocations
            .map((loc) =>
              loc
                .toLowerCase()
                .split(/\s+/)
                .join(' & ')
            )
            .join(' | ');
          relevanceCalculation += ` (CASE WHEN location_vector @@ to_tsquery('simple', $${paramIndex}) THEN 1 ELSE 0 END) +`;
          relevanceParams.push(preferredLocationsQuery);
          paramIndex++;
        } else {
          relevanceCalculation += ` 0 +`;
        }
      }

      // 4) Company
      if (company) {
        relevanceCalculation += ` (CASE WHEN company = $${paramIndex} THEN 1 ELSE 0 END)`;
        relevanceParams.push(company);
        paramIndex++;
      } else {
        relevanceCalculation += ` 0`;
      }

      relevanceCalculation += `) AS relevance`;
      queryText += `, ${relevanceCalculation}`;
    }

    // === FROM
    queryText += `
      FROM jobPostings
      WHERE 1 = 1
    `;

    // Build WHERE conditions

    // 1) Title conditions
    if (titleGroup.length > 0) {
      const titleConditions = titleGroup.map((t, i) => {
        const idx = paramIndex + i;
        return `title_vector @@ to_tsquery('english', $${idx})`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
      filterParams.push(
        ...titleGroup.map((t) => t.trim().replace(/\s+/g, ' & '))
      );
      paramIndex += titleGroup.length;
    }

    // 2) Experience Level - Always include null experience levels
    if (experienceLevel) {
      queryText += ` AND (LOWER(experiencelevel) = $${paramIndex} OR experiencelevel IS NULL)`;
      filterParams.push(experienceLevel);
      paramIndex++;
    }

    // 3) Location
    if (locationSearchTerms.length > 0) {
      const tsquery = locationSearchTerms
        .map((term) =>
          term.includes(' ') ? term.split(' ').join(' & ') : term
        )
        .join(' | ');
      queryText += ` AND location_vector @@ to_tsquery('simple', $${paramIndex})`;
      filterParams.push(tsquery);
      paramIndex++;
    }

    // 4) Company
    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      filterParams.push(company);
      paramIndex++;
    }

    // Order by relevance and recency
    queryText += `
      ORDER BY 
        relevance DESC,
        created_at DESC
    `;

    // Add LIMIT/OFFSET
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1};`;
    params.push(...relevanceParams, ...filterParams, limit, offset);

    // Timings
    const queryPrepStart = performance.now();
    const queryExecStart = performance.now();

    // Execute query
    const result = await executeQueryWithTimeout(queryText, params);

    const queryExecEnd = performance.now();
    timings.queryExecution = queryExecEnd - queryExecStart;
    const queryPrepEnd = performance.now();
    timings.queryPreparation = queryPrepEnd - queryPrepStart;

    // Process rows if needed
    const jobPostings = processJobPostings(result.rows);

    // Cache the response - use different TTL based on whether it's user-specific
    if (jobPostings.length > 0 && hasSearchCriteria) {
      await setCached(
        cacheKey,
        null, // no need for user ID parameter anymore
        JSON.stringify({ jobPostings, timings }),
        applyJobPrefs ? 300 : 1800 // 5 mins for user-specific, 30 mins for general
      );
    }

    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;

    // Function to get jobs with relaxed filters
    const getJobsWithRelaxedFilters = async (queryText, params, removedFilter) => {
      // Create new arrays without the removed filter's parameters
      const newParams = [...params];
      const filterToRemove = removedFilter === 'title' ?
        titleGroup.length : // Remove title parameters
        1; // Remove single parameter for location

      // Remove the filter's parameters
      newParams.splice(
        removedFilter === 'title' ?
          relevanceParams.length : // Title params start after relevance params
          relevanceParams.length + titleGroup.length, // Location params start after title params
        filterToRemove
      );

      // Modify query text to remove the filter condition
      const modifiedQuery = queryText.replace(
        removedFilter === 'title' ?
          /AND \(title_vector @@ to_tsquery\('english', \$\d+\)\)/ :
          /AND location_vector @@ to_tsquery\('simple', \$\d+\)/,
        ''
      );

      return await query(modifiedQuery, newParams);
    };

    try {
      // First try with all filters
      let result = await query(queryText, params);
      let metadata = {
        relaxedFilters: {
          removedTitle: false,
          removedLocation: false
        },
        hasMore: result.rows.length > 0
      };

      // If no results and we have filters to relax
      if (result.rows.length === 0 && page === 1) {
        // Try removing title first if it exists
        if (title) {
          console.log('Relaxing title filter...');
          result = await getJobsWithRelaxedFilters(queryText, params, 'title');
          metadata.relaxedFilters.removedTitle = true;
        }
        // If still no results and we have location, try removing that
        if (result.rows.length === 0 && location) {
          console.log('Relaxing location filter...');
          result = await getJobsWithRelaxedFilters(queryText, params, 'location');
          metadata.relaxedFilters.removedLocation = true;
        }
      }

      const jobPostings = processJobPostings(result.rows);

      return Response.json({
        jobPostings,
        metadata,
        timings,
        ok: true
      }, { status: 200 });

    } catch (error) {
      console.error("Error fetching job postings:", error);
      return Response.json({ error: "Error fetching job postings" }, { status: 500 });
    }

  } catch (error) {
    if (error.message === 'Request aborted') {
      return Response.json({ error: 'Request was aborted', ok: false }, { status: 499 });
    }
    if (error.message === 'Query timed out') {
      return Response.json({
        error: 'Request timed out',
        ok: false
      }, { status: 408 });
    }
    console.error("Error fetching job postings:", error);
    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;
    return Response.json(
      { error: "Error fetching job postings", timings, ok: false },
      { status: 500 }
    );
  }
}


export async function PUT(req) {
  const { signal } = req;
  try {
    if (signal.aborted) {
      throw new Error('Request aborted');
    }

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

    const result = await query(updateQuery, [summary, jobId] /*, { signal }*/);

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
    if (error.message === 'Request aborted') {
      return new Response(JSON.stringify({ error: 'Request was aborted' }), { status: 499 });
    }
    console.error("Error updating job posting:", error);
    return new Response(
      JSON.stringify({ error: "Error updating job posting" }),
      { status: 500 }
    );
  }
}

// Force dynamic to ensure we check cache on each request
export const dynamic = 'force-dynamic';