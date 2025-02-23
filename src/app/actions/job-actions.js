'use server';

import { query } from "@/lib/pgdb";
import { getCached, setCached } from '@/lib/cache';
import { getStateAbbreviation, getNearbyStates } from '@/lib/stateRelationships';
import { processJobPostings } from '@/lib/job-utils';
import { revalidatePath } from 'next/cache';
import { ServerError, handleServerError } from '@/lib/server-utils';
import { findJobTitleGroup } from '@/lib/jobTitleMappings';

const QUERY_TIMEOUT_MS = 10000;

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

const expandLocation = (location) => {
  if (!location) return [];
  const lowercaseLocation = location.toLowerCase();
  let searchTerms = [lowercaseLocation];

  const stateAbbr = getStateAbbreviation(location);
  if (stateAbbr) {
    const nearbyStatesList = getNearbyStates(stateAbbr);
    nearbyStatesList.forEach(stateCode => {
      searchTerms.push(stateCode.toLowerCase());
    });
  }

  const cityStateMatch = lowercaseLocation.match(/([^,]+),?\s*([a-z]{2}|[^,]+)$/i);
  if (cityStateMatch) {
    const [_, city, state] = cityStateMatch;
    const trimmedCity = city.trim();
    searchTerms.push(trimmedCity);

    const stateAbbr = getStateAbbreviation(state.trim());
    if (stateAbbr) {
      const nearbyStatesList = getNearbyStates(stateAbbr);
      nearbyStatesList.forEach(nearbyState => {
        searchTerms.push(`${trimmedCity}, ${nearbyState}`);
      });
    }
  }

  return [...new Set(searchTerms)];
};

export async function getJobPostings(searchParams) {
  try {
    const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);
    
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "20");
    const strictParam = params.get("strictSearch");
    const strict = strictParam !== 'false'; 

    if (page < 1 || limit > 50) {
      throw new ServerError("Invalid page or limit parameters", 400);
    }

    const offset = (page - 1) * limit;

    // Process titles and separate into include and exclude terms
    let includeTitles = [];
    let excludeTitles = [];
    
    const titleParams = params.getAll("title");
    console.log('Raw title params:', titleParams);
    
    for (let titleParam of titleParams) {
      // First decode the URL parameter
      const decodedTitle = decodeURIComponent(titleParam);
      console.log('Decoded title param:', decodedTitle);
      
      // Split the title into terms by spaces
      const terms = decodedTitle.split(/\s+/);
      let currentPhrase = [];
      
      // Process each term
      for (let term of terms) {
        if (term.startsWith('-')) {
          // If we have a current phrase, add it to includeTitles
          if (currentPhrase.length > 0) {
            includeTitles.push(currentPhrase.join(' '));
            currentPhrase = [];
          }
          // Add the term without '-' to excludeTitles
          excludeTitles.push(term.substring(1));
        } else {
          currentPhrase.push(term);
        }
      }
      
      // Add any remaining phrase to includeTitles
      if (currentPhrase.length > 0) {
        includeTitles.push(currentPhrase.join(' '));
      }
    }

    console.log('Include titles:', includeTitles);
    console.log('Exclude titles:', excludeTitles);

    // Remove duplicates case-insensitively
    includeTitles = [...new Map(includeTitles.map(t => [t.toLowerCase(), t])).values()];
    excludeTitles = [...new Map(excludeTitles.map(t => [t.toLowerCase(), t])).values()];
    
    const locations = params.getAll("location").filter(Boolean).map(loc => loc.toLowerCase());
    const experienceLevels = params.getAll("experienceLevel").filter(Boolean);
    const company = params.get("company")?.trim() || "";
    const keywords = params.get("keywords")?.trim() || "";

    // Update cache key to include exclude terms
    const cacheKey = `jobPostings-${includeTitles.join('-')}-${excludeTitles.join('-')}-${locations.join('-')}-${experienceLevels.join('-')}-${company}-${page}-${limit}-${keywords}`;

    const cachedResponse = await getCached(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    let queryText = `
      WITH RankedJobs AS (
        SELECT 
          job_id,
          title,
          company,
          location,
          description,
          salary,
          experiencelevel,
          created_at,
          source_url,
          ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) as rn
        FROM jobPostings
        WHERE 1=1
    `;
    
    const paramsArray = [];
    
    // Handle inclusive title search
    if (includeTitles.length > 0) {
      const titleConditions = includeTitles.map((_, idx) => {
        paramsArray.push(`%${includeTitles[idx]}%`);
        return `title ILIKE $${paramsArray.length}`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
    }

    // Handle exclusive title search
    if (excludeTitles.length > 0) {
      excludeTitles.forEach((title) => {
        paramsArray.push(`%${title}%`);
        queryText += ` AND title NOT ILIKE $${paramsArray.length}`;
      });
    }

    if (locations.length > 0) {
      const locationConditions = locations.map((_, idx) => {
        paramsArray.push(`%${locations[idx]}%`);
        return `LOWER(location) LIKE LOWER($${paramsArray.length})`;
      });
      queryText += ` AND (${locationConditions.join(' OR ')})`;
    }

    if (experienceLevels.length > 0) {
      const levelConditions = experienceLevels.map((_, idx) => {
        paramsArray.push(experienceLevels[idx]);
        return `LOWER(experiencelevel) = LOWER($${paramsArray.length})`;
      });
      queryText += ` AND (${levelConditions.join(' OR ')})`;
    }

    if (company) {
      paramsArray.push(company);
      queryText += ` AND company = $${paramsArray.length}`;
    }

    if (keywords) {
      const keywordArray = keywords.split('+').map(keyword => `%${keyword}%`);
      const keywordConditions = keywordArray.map((keyword) => {
        paramsArray.push(keyword);
        return `LOWER(description) LIKE LOWER($${paramsArray.length})`;
      });
      queryText += ` AND (${keywordConditions.join(' OR ')})`;
    }

    queryText += `) 
      SELECT 
        job_id,
        title,
        company,
        location,
        description,
        salary,
        experiencelevel,
        created_at,
        source_url
      FROM RankedJobs 
      WHERE rn = 1 
      ORDER BY created_at DESC 
      LIMIT $${paramsArray.length + 1} OFFSET $${paramsArray.length + 2}`;

    paramsArray.push(limit, offset);

    console.log('Final SQL Query:', queryText);
    console.log('Query parameters:', paramsArray);

    const result = await executeQueryWithTimeout(queryText, paramsArray);
    console.log('Query result count:', result.rows.length);
    
    if (!result) {
      throw new ServerError("No results found", 404);
    }

    const response = {
      jobPostings: processJobPostings(result.rows),
      ok: true,
      page,
      limit,
      total: result.rows.length
    };

    await setCached(cacheKey, response, 60 * 5);
    return response;

  } catch (error) {
    return handleServerError(error);
  }
}

export async function updateJobSummary(jobId, summary) {
  try {
    if (!jobId || !summary) {
      throw new ServerError("Job ID and summary are required", 400);
    }

    const updateQuery = `
      UPDATE jobPostings 
      SET summary = $1 
      WHERE job_id = $2 
      RETURNING *`;

    const result = await query(updateQuery, [summary, jobId]);

    if (result.rows.length === 0) {
      throw new ServerError("Job posting not found", 404);
    }

    revalidatePath('/job-postings');
    return {
      success: true,
      data: result.rows[0]
    };

  } catch (error) {
    return handleServerError(error);
  }
}

export async function getJobPostingsCount(searchParams) {
  try {
    const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);
    
    // Process titles and separate into include and exclude terms
    let includeTitles = [];
    let excludeTitles = [];
    
    const titleParams = params.getAll("title");
    
    for (let titleParam of titleParams) {
      const decodedTitle = decodeURIComponent(titleParam);
      const terms = decodedTitle.split(/\s+/);
      let currentPhrase = [];
      
      for (let term of terms) {
        if (term.startsWith('-')) {
          if (currentPhrase.length > 0) {
            includeTitles.push(currentPhrase.join(' '));
            currentPhrase = [];
          }
          excludeTitles.push(term.substring(1));
        } else {
          currentPhrase.push(term);
        }
      }
      
      if (currentPhrase.length > 0) {
        includeTitles.push(currentPhrase.join(' '));
      }
    }

    // Remove duplicates case-insensitively
    includeTitles = [...new Map(includeTitles.map(t => [t.toLowerCase(), t])).values()];
    excludeTitles = [...new Map(excludeTitles.map(t => [t.toLowerCase(), t])).values()];

    const locations = params.getAll("location").filter(Boolean).map(loc => loc.toLowerCase());
    const experienceLevels = params.getAll("experienceLevel").filter(Boolean);
    const company = params.get("company")?.trim() || "";
    const keywords = params.get("keywords")?.trim() || "";

    const cacheKey = `job-count:${includeTitles.join('-')}:${excludeTitles.join('-')}:${locations.join('-')}:${experienceLevels.join('-')}:${company}:${keywords}`;
    const cachedResult = await getCached(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let queryText = `
      WITH RankedJobs AS (
        SELECT 
          job_id,
          ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) as rn
        FROM jobPostings
        WHERE 1=1
    `;

    const paramsArray = [];

    // Handle inclusive title search
    if (includeTitles.length > 0) {
      const titleConditions = includeTitles.map((_, idx) => {
        paramsArray.push(`%${includeTitles[idx]}%`);
        return `title ILIKE $${paramsArray.length}`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
    }

    // Handle exclusive title search
    if (excludeTitles.length > 0) {
      excludeTitles.forEach((title) => {
        paramsArray.push(`%${title}%`);
        queryText += ` AND title NOT ILIKE $${paramsArray.length}`;
      });
    }

    if (locations.length > 0) {
      const locationConditions = locations.map((_, idx) => {
        paramsArray.push(`%${locations[idx]}%`);
        return `LOWER(location) LIKE LOWER($${paramsArray.length})`;
      });
      queryText += ` AND (${locationConditions.join(' OR ')})`;
    }

    if (experienceLevels.length > 0) {
      const levelConditions = experienceLevels.map((_, idx) => {
        paramsArray.push(experienceLevels[idx]);
        return `LOWER(experiencelevel) = LOWER($${paramsArray.length})`;
      });
      queryText += ` AND (${levelConditions.join(' OR ')})`;
    }

    if (company) {
      paramsArray.push(company);
      queryText += ` AND company = $${paramsArray.length}`;
    }

    if (keywords) {
      const keywordArray = keywords.split('+').map(keyword => `%${keyword}%`);
      const keywordConditions = keywordArray.map((keyword) => {
        paramsArray.push(keyword);
        return `LOWER(description) LIKE LOWER($${paramsArray.length})`;
      });
      queryText += ` AND (${keywordConditions.join(' OR ')})`;
    }

    queryText += `) 
      SELECT COUNT(*) as total_count
      FROM RankedJobs 
      WHERE rn = 1`;

    const result = await query(queryText, paramsArray);
    const count = parseInt(result.rows[0]?.total_count || 0);

    const response = { count, ok: true };
    await setCached(cacheKey, response, 60 * 60);
    return response;

  } catch (error) {
    return handleServerError(error);
  }
}

function hashStringToInt(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function getCompanies() {
  try {
    const cachedCompanies = await getCached('companies');
    if (cachedCompanies) {
      return { companies: cachedCompanies, ok: true };
    }

    const result = await query(`
      SELECT company
      FROM unique_companies
      ORDER BY company ASC;
    `);

    const companies = result.rows
      .map((row) => row.company)
      .filter((company) => company)
      .map((company) => ({
        id: hashStringToInt(company),
        name: company,
        logo: `https://logo.clearbit.com/${encodeURIComponent(company.replace('.com', ''))}.com`,
      }));

    if (companies.length > 0) {
      await setCached('companies', companies);
    }

    return { companies, ok: true };
  } catch (error) {
    return handleServerError(error);
  }
}