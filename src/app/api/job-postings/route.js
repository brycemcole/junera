// /pages/api/jobPostings.js

import { query } from "@/lib/pgdb"; // Import the query method from db.js
import { headers } from "next/headers";
import { performance } from 'perf_hooks';
const he = require('he');
import { getCached, setCached } from '@/lib/cache'; // Add this import
import { getRelatedTitles } from '@/lib/jobTitleMappings'; // Add this import
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
import jwt from 'jsonwebtoken';
import { scanKeywords } from '@/lib/job-utils';
import { processJobPostings } from '@/lib/job-utils';
import { getStateAbbreviation, getNearbyStates } from '@/lib/stateRelationships';
import { set } from "date-fns";
const SECRET_KEY = process.env.SESSION_SECRET;
const QUERY_TIMEOUT_MS = 10000;
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

  // Check if it's a state abbreviation or name to include nearby states
  const stateAbbr = getStateAbbreviation(location);
  if (stateAbbr) {
    const nearbyStatesList = getNearbyStates(stateAbbr);
    // Add both abbreviations and full names for all nearby states
    nearbyStatesList.forEach(stateCode => {
      searchTerms.push(stateCode.toLowerCase());
      const stateName = Object.entries(stateMap).find(([name, abbr]) => abbr === stateCode)?.[0];
      if (stateName) {
        searchTerms.push(stateName);
      }
    });
  }

  // Add partial matches for cities with state
  const cityStateMatch = lowercaseLocation.match(/([^,]+),?\s*([a-z]{2}|[^,]+)$/i);
  if (cityStateMatch) {
    const [_, city, state] = cityStateMatch;
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    
    // Add the city by itself
    searchTerms.push(trimmedCity);

    // Get state abbreviation and nearby states
    const stateAbbr = getStateAbbreviation(trimmedState);
    if (stateAbbr) {
      const nearbyStatesList = getNearbyStates(stateAbbr);
      // Add city combinations with all nearby states
      nearbyStatesList.forEach(nearbyState => {
        searchTerms.push(`${trimmedCity}, ${nearbyState}`);
        const stateName = Object.entries(stateMap).find(([name, abbr]) => abbr === nearbyState)?.[0];
        if (stateName) {
          searchTerms.push(`${trimmedCity}, ${stateName}`);
        }
      });
    }
  }

  return [...new Set(searchTerms)]; // Remove duplicates
};

export async function GET(req) {
  const { signal } = req;
  const url = req.url;
  const { searchParams } = new URL(url);

  try {
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const strictParam = searchParams.get("strictSearch");
    const strict = strictParam !== 'false'; 

    if (page < 1 || limit > 50) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Get all values for multi-value parameters
    const titles = searchParams.getAll("title").filter(Boolean);
    const locations = searchParams.getAll("location").filter(Boolean).map(loc => loc.toLowerCase());
    const experienceLevels = searchParams.getAll("experienceLevel").filter(Boolean);
    const company = searchParams.get("company")?.trim() || "";

    const cacheKey = `jobPostings-${titles.join('-')}-${locations.join('-')}-${experienceLevels.join('-')}-${company}-${page}-${limit}`;
    const cachedResponse = await getCached(cacheKey);
    if (cachedResponse) {
      return Response.json(cachedResponse);
    }

    let queryText = `
      SELECT DISTINCT ON (job_id)
        job_id,
        title,
        company,
        location,
        description,
        salary,
        experiencelevel,
        created_at,
        source_url
      FROM jobPostings
      WHERE 1=1
    `;
    
    const params = [];
    
    // Handle multiple titles
    if (titles.length > 0) {
      const titleConditions = titles.map((_, idx) => {
        params.push(`%${titles[idx]}%`);
        return `LOWER(title) LIKE LOWER($${params.length})`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
    }

    // Handle multiple locations
    if (locations.length > 0) {
      const locationConditions = locations.map((_, idx) => {
        params.push(`%${locations[idx]}%`);
        return `LOWER(location) LIKE LOWER($${params.length})`;
      });
      queryText += ` AND (${locationConditions.join(' OR ')})`;
    }

    // Handle multiple experience levels
    if (experienceLevels.length > 0) {
      const levelConditions = experienceLevels.map((_, idx) => {
        params.push(experienceLevels[idx]);
        return `LOWER(experiencelevel) = LOWER($${params.length})`;
      });
      queryText += ` AND (${levelConditions.join(' OR ')})`;
    }

    if (company) {
      params.push(company);
      queryText += ` AND company = $${params.length}`;
    }

    // Add pagination parameters last
    params.push(limit, offset);
    queryText += ` ORDER BY job_id, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    console.log('Query:', queryText);
    console.log('Params:', params);

    const result = await query(queryText, params);

    // store in cache with cachekey
    const response = {
      jobPostings: processJobPostings(result.rows),
      ok: true,
      page,
      limit,
      total: result.rows.length
    };
    await setCached(cacheKey, response, 60 * 5);
    
    return Response.json(response);

  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ 
      error: "Error fetching job postings",
      details: error.message,
      ok: false 
    }, { 
      status: 500 
    });
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

    // store in cache with cachekey
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

export const dynamic = 'force-dynamic';