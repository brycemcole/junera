// /pages/api/jobPostingsCount.js (or your appropriate file)
import { query } from "@/lib/pgdb"; // Import the query method from pgdb
import { getCached, setCached } from '@/lib/cache'; // ...existing code...

function formatForFullTextSearch(text) {
  // Escape double quotes for SQL
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Extract and sanitize search filters
  const title = searchParams.get("title")?.trim() || "";
  const experienceLevel = searchParams.get("experienceLevel")?.trim().toLowerCase() || "";
  const location = searchParams.get("location")?.trim() || "";
  const company = searchParams.get("company")?.trim() || "";

  // 1. Define state name to abbreviation mapping
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
    'wyoming': 'WY'
  };

  // 2. Create reverse mapping: abbreviation to full state name
  const abbrMap = {};
  for (const [name, abbr] of Object.entries(stateMap)) {
    abbrMap[abbr.toLowerCase()] = name;
  }

  // 3. Generate search terms based on the input location
  let locationSearchTerms = [location];

  if (stateMap[location.toLowerCase()]) {
    locationSearchTerms.push(stateMap[location.toLowerCase()]);
  } else if (abbrMap[location.toLowerCase()]) {
    locationSearchTerms.push(abbrMap[location.toLowerCase()]);
  }

  try {
    // Prepare query parameters
    const params = [];
    let paramIndex = 1;

    // Build the count query
    let queryText = `
      SELECT COUNT(*) AS totalJobs
      FROM jobPostings
      WHERE 1 = 1
    `;

    // Full-text search on title
    if (title) {
      queryText += ` AND title_vector @@ to_tsquery('english', $${paramIndex})`;
      params.push(title.trim().replace(/\s+/g, ' & '));
      paramIndex++;
    }

    // Experience level filter using LOWER
    if (experienceLevel) {
      queryText += ` AND LOWER(experiencelevel) = $${paramIndex}`;
      params.push(experienceLevel);
      paramIndex++;
    }

    // Location filter using full-text search with 'simple' configuration
    if (location) {
      queryText += ` AND location_vector @@ plainto_tsquery('simple', $${paramIndex})`;
      params.push(location);
      paramIndex++;
    }

    // Company filter
    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    const result = await query(queryText, params);
    const totalJobs = result.rows[0]?.totaljobs || 0;

    setCached('job-postings-count', { title, experienceLevel, location, company }, totalJobs);

    return new Response(JSON.stringify({ totalJobs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return new Response(JSON.stringify({ error: "Error fetching total jobs" }), { status: 500 });
  }
}