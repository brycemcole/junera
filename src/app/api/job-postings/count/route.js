import { query } from "@/lib/pgdb";
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
import { getCached, setCached } from '@/lib/cache';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(req) {
  try {
    // Authenticate User
    const authHeader = req.headers.get('Authorization');
    let user = null;
    let userPreferredTitles = [];
    let userPreferredLocations = [];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          if (!SECRET_KEY) {
            console.warn('SESSION_SECRET is not configured');
            return Response.json({ error: 'Server configuration error' }, { status: 500 });
          }
          const decoded = jwt.verify(token, SECRET_KEY);
          user = decoded;
          userPreferredTitles = user.jobPrefsTitle || [];
          userPreferredLocations = user.jobPrefsLocation || [];
        } catch (error) {
          console.debug('Token verification failed:', error.message);
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
    } else {
      userPreferredTitles = [];
      userPreferredLocations = [];
    }

    // Normalize cache key parameters
    const normalizedParams = {
      title: title || "",
      location: location || "",
      company: company || "",
      experienceLevel: experienceLevel || "",
      applyJobPrefs: applyJobPrefs,
      userPrefs: applyJobPrefs ? {
        titles: userPreferredTitles,
        locations: userPreferredLocations
      } : null
    };

    // Create a deterministic cache key using hashing
    const cacheKey = crypto.createHash('sha256').update(JSON.stringify(normalizedParams)).digest('hex');

    // Attempt to retrieve cached count
    const cachedCount = await getCached(`jobCount:${cacheKey}`, user?.id);
    if (cachedCount) {
      return Response.json(JSON.parse(cachedCount), { status: 200 });
    }

    // Build the count query
    const params = [];
    let paramIndex = 1;
    let queryText = `SELECT COUNT(id) AS totaljobs FROM jobPostings WHERE 1=1`;

    if (title) {
      const titleGroup = findJobTitleGroup(title);
      if (titleGroup.length > 0) {
        const orQuery = titleGroup.map(t => t.trim().replace(/\s+/g, ' & ')).join(' | ');
        queryText += ` AND title_vector @@ to_tsquery('english', $${paramIndex})`;
        params.push(orQuery);
        paramIndex++;
      }
    }

    if (experienceLevel) {
      queryText += ` AND experiencelevel ILIKE $${paramIndex}`;
      params.push(experienceLevel);
      paramIndex++;
    }

    if (location && location.length > 2) {
      queryText += ` AND location_vector @@ plainto_tsquery('simple', $${paramIndex})`;
      params.push(location);
      paramIndex++;
    }

    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    console.log(queryText);
    // Execute the count query with a timeout
    const result = await Promise.race([
      query(queryText, params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )
    ]);

    const totalJobs = parseInt(result.rows[0]?.totaljobs, 10) || 0;
    const responseData = { totalJobs };

    // Cache the count result
    await setCached(
      `jobCount:${cacheKey}`,
      user?.id,
      JSON.stringify(responseData),
      1800 // 30 minutes TTL
    );

    return Response.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    // Fallback to approximate count or a default value
    try {
      const approximateCountResult = await query(`
        SELECT reltuples::BIGINT AS approximate_count
        FROM pg_class
        WHERE relname = 'jobPostings'
      `);
      const approximateCount = approximateCountResult.rows[0]?.approximate_count || 1000;
      return Response.json({ totalJobs: approximateCount }, { status: 200 });
    } catch (approxError) {
      console.error("Error fetching approximate count:", approxError);
      return Response.json({ totalJobs: 1000 }, { status: 200 });
    }
  }
}

export const dynamic = 'force-dynamic';
