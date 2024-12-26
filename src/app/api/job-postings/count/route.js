import { query } from "@/lib/pgdb";
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
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

    if (authHeader) {
      token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, SECRET_KEY);
          user = decoded;
          userPreferredTitles = user.jobPrefsTitle || [];
          userPreferredLocations = user.jobPrefsLocation || [];
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    }

    const { searchParams } = new URL(req.url);

    // Extract and sanitize search filters
    let title = searchParams.get("title")?.trim() || "";
    let location = (searchParams.get("location")?.trim() || "").toLowerCase();
    const company = searchParams.get("company")?.trim() || "";
    const experienceLevel = searchParams.get("experienceLevel")?.trim().toLowerCase() || "";

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
      const titleConditions = titleGroup.map((t, i) => {
        const idx = paramIndex + i;
        return `title_vector @@ to_tsquery('english', $${idx})`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
      params.push(...titleGroup.map(t => t.trim().replace(/\s+/g, ' & ')));
      paramIndex += titleGroup.length;
    }

    // Experience level filter
    if (experienceLevel) {
      queryText += ` AND LOWER(experiencelevel) = $${paramIndex}`;
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

    // Execute the query
    const result = await query(queryText, params);
    const totalJobs = result.rows[0]?.totaljobs || 0;

    return Response.json({ totalJobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching total jobs:", error);
    return Response.json({ error: "Error fetching total jobs" }, { status: 500 });
  }
}