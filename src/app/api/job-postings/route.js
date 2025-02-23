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

import { getJobPostings, updateJobSummary, getJobPostingsCount, getCompanies } from '@/app/actions/job-actions';

export async function GET(req) {
  const { signal } = req;
  const url = req.url;
  const { searchParams } = new URL(url);

  try {
    const response = await getJobPostings(searchParams);
    return Response.json(response);
  } catch (error) {
    console.error("Error in job-postings route:", error);
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
  try {
    const { jobId, summary } = await req.json();

    // Validate inputs
    if (!jobId || !summary) {
      return Response.json({ error: "Job ID and summary are required" }, { status: 400 });
    }

    const response = await updateJobSummary(jobId, summary);
    return Response.json(response);

  } catch (error) {
    console.error("Error updating job posting:", error);
    return Response.json({ error: "Error updating job posting" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';