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
  const experienceLevel = searchParams.get("experienceLevel")?.trim() || "";
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

  if (stateMap[location]) {
    // If the input is a full state name, add its abbreviation
    locationSearchTerms.push(stateMap[location].toLowerCase());
  } else if (abbrMap[location]) {
    // If the input is a state abbreviation, add its full name
    locationSearchTerms.push(abbrMap[location].toLowerCase());
  }
  try {
    // Build the count query
    let queryText = `
      SELECT COUNT(jp.job_id) AS totalJobs
      FROM jobPostings jp
      WHERE 1=1
    `;

    const params = [];
    const entryLevelIndicators = ['1 year of', 'graduate', 'entry level', 'junior'];
    const entryLevelTitleIndicators = ['new grad', 'college graduate', 'associate'];
    const exclusionIndicators = ['senior', 'manager', 'lead', 'director', 'principal', 'vice', 'vp', 'head'];
    let paramIndex = 1; // PostgreSQL uses 1-based indexing for parameters

    if (title) {
      queryText += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${title}%`);
      paramIndex++;
    }
    if (experienceLevel) {
      if (experienceLevel === 'entry') {
        // Build inclusion conditions for entry-level indicators in description
        const descriptionConditions = entryLevelIndicators
          .map((_, i) => `description ILIKE $${paramIndex + i}`)
          .join(' OR ');

        // Build inclusion conditions for entry-level indicators in title
        const titleConditions = entryLevelTitleIndicators
          .map((_, i) => `title ILIKE $${paramIndex + entryLevelIndicators.length + i}`)
          .join(' OR ');

        // Combine description and title inclusion conditions
        const inclusionConditions = `(${descriptionConditions} OR ${titleConditions})`;

        queryText += ` AND (${inclusionConditions})`;

        // Add parameters for description indicators
        const descriptionParams = entryLevelIndicators.map(indicator => `%${indicator}%`);
        // Add parameters for title indicators
        const titleParams = entryLevelTitleIndicators.map(indicator => `%${indicator}%`);

        params.push(...descriptionParams, ...titleParams);
        paramIndex += entryLevelIndicators.length + entryLevelTitleIndicators.length;

        // Build exclusion conditions to exclude senior and similar roles
        const exclusionConditions = exclusionIndicators
          .map((_, i) => `(experiencelevel ILIKE $${paramIndex + i} OR description ILIKE $${paramIndex + i} OR title ILIKE $${paramIndex + i})`)
          .join(' OR ');

        queryText += ` AND NOT (${exclusionConditions})`;

        // Add parameters for exclusion indicators
        const exclusionParams = exclusionIndicators.map(indicator => `%${indicator}%`);
        params.push(...exclusionParams);
        paramIndex += exclusionIndicators.length;
      } else {
        // Existing logic for other experience levels
        queryText += ` AND experiencelevel ILIKE $${paramIndex}`;
        params.push(`%${experienceLevel}%`);
        paramIndex++;
      }
    }
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
      // Assuming company is the company name (TEXT field)
      queryText += ` AND company ILIKE $${paramIndex}`;
      params.push(`%${company}%`);
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