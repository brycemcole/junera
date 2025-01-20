import { query } from "@/lib/pgdb";
import { findJobTitleGroup } from '@/lib/jobTitleMappings';
import { getCached, setCached } from '@/lib/cache';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(req) {
  console.log('Fetching job posting count...');
  const { signal } = req;
  const url = req.url;
  const { searchParams } = new URL(url);

  // Extract query params
  let title = (searchParams.get("title") || "").trim();
  let location = (searchParams.get("location") || "").trim().toLowerCase();
  const company = (searchParams.get("company") || "").trim();
  let experienceLevel = (searchParams.get("experienceLevel") || "").trim().toLowerCase();

  // Get title group if title provided
  let titleGroup = [];
  if (title) {
    titleGroup = findJobTitleGroup(title);
  }

  try {
    if (signal.aborted) {
      throw new Error('Request aborted');
    }

    // Build the COUNT query
    let queryText = `SELECT COUNT(*) FROM jobPostings WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    // Add filters
    if (titleGroup.length > 0) {
      const titleConditions = titleGroup.map((t, i) => {
        const idx = paramIndex + i;
        return `title_vector @@ to_tsquery('english', $${idx})`;
      });
      queryText += ` AND (${titleConditions.join(' OR ')})`;
      params.push(...titleGroup.map(t => t.trim().replace(/\s+/g, ' & ')));
      paramIndex += titleGroup.length;
    }

    if (location) {
      queryText += ` AND location_vector @@ to_tsquery('simple', $${paramIndex})`;
      params.push(location.replace(/\s+/g, ' & '));
      paramIndex++;
    }

    if (company) {
      queryText += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    if (experienceLevel) {
      queryText += ` AND LOWER(experiencelevel) = $${paramIndex}`;
      params.push(experienceLevel);
    }

    // Execute query
    const result = await query(queryText, params);
    const count = parseInt(result.rows[0].count);

    return Response.json({ count, ok: true }, { status: 200 });

  } catch (error) {
    if (error.message === 'Request aborted') {
      return Response.json({ error: 'Request was aborted', ok: false }, { status: 499 });
    }
    console.error("Error fetching job posting count:", error);
    return Response.json({ error: "Error fetching job posting count", ok: false }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
