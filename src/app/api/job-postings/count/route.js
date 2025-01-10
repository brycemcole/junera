import { query } from "@/lib/pgdb";
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
import { getCached, setCached } from '@/lib/cache';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(req) {
  try {
    // Get auth header and validate user
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

    const { searchParams } = new URL(req.url);

    // Extract and sanitize search filters
    let title = searchParams.get("title")?.trim() || "";
    let location = (searchParams.get("location")?.trim() || "").toLowerCase();
    const company = searchParams.get("company")?.trim() || "";
    let experienceLevel = (searchParams.get("experienceLevel") || "").trim().toLowerCase();
    if (experienceLevel === 'entry level') {
      experienceLevel = 'entry';
    }

    // Handle job preferences
    const applyPrefsParam = searchParams.get('applyJobPrefs');
    let applyJobPrefs = false;

    if (user && (applyPrefsParam === 'true' || applyPrefsParam === null)) {
      applyJobPrefs = true;
    }

    // Apply preferences if enabled
    if (applyJobPrefs) {
      if (!title && userPreferredTitles.length > 0) {
        title = userPreferredTitles[0];
      }
      if (!location && userPreferredLocations.length > 0) {
        location = userPreferredLocations[0].toLowerCase();
      }
    }

    // Clear these if we're not applying preferences
    if (!applyJobPrefs) {
      userPreferredTitles = [];
      userPreferredLocations = [];
    }

    // Create deterministic cache key from search params
    const cacheKey = JSON.stringify({
      title: searchParams.get("title")?.trim() || "",
      location: (searchParams.get("location")?.trim() || "").toLowerCase(),
      company: searchParams.get("company")?.trim() || "",
      experienceLevel: experienceLevel,
      applyJobPrefs: applyPrefsParam,
      userPrefs: applyJobPrefs ? {
        titles: userPreferredTitles,
        locations: userPreferredLocations
      } : null
    });

    // Check cache first
    const cachedCount = await getCached(`jobCount:${cacheKey}`, user?.id);
    if (cachedCount) {
      console.log('Cache hit for count:', cacheKey);
      return Response.json(JSON.parse(cachedCount), { status: 200 });
    }

    // Get the entire group of related titles if a title search is provided
    const titleGroup = title ? findJobTitleGroup(title) : [];

    // Prepare query parameters
    const params = [];
    let paramIndex = 1;

    // Build the count query with relevance calculation for better consistency
    let queryText = `
      SELECT COUNT(*) AS totalJobs
      FROM jobPostings
      WHERE 1 = 1
    `;

    // Title search using title group
    if (title) {
      const orQuery = titleGroup.map(t => t.trim().replace(/\s+/g, ' & ')).join(' | ');
      queryText += ` AND title_vector @@ to_tsquery('english', $${paramIndex})`;
      params.push(orQuery);
      paramIndex++;
    }

    // Experience level filter
    if (experienceLevel) {
      queryText += ` AND experiencelevel ILIKE $${paramIndex}`;
      params.push(experienceLevel);
      paramIndex++;
    }

    // Location filter
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
    console.log('Total jobs query:', queryText, params);
    // Execute the query
    const result = await query(queryText, params);
    const totalJobs = result.rows[0]?.totaljobs || 0;

    const responseData = { totalJobs };

    // Cache the count for 5 minutes
    await setCached(
      `jobCount:${cacheKey}`,
      user?.id,
      JSON.stringify(responseData),
      300
    );

    return Response.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return Response.json({ error: "Error fetching total jobs" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';