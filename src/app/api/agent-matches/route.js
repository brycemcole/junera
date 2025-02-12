import { NextResponse } from "next/server";
import { query } from "@/lib/pgdb";
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // First trigger processing of any new jobs for this user
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent-process`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        }
      });
    } catch (error) {
      console.error('Error triggering job processing:', error);
    }

    // Get matches with detailed job information and proper ordering
    const results = await query(`
      SELECT 
        ap.id as match_id,
        ap.is_match,
        ap.match_reason,
        ap.confidence_score,
        ap.processed_at,
        j.id as job_id,
        j.title,
        j.company,
        j.location,
        j.description,
        j.created_at,
        j.experience_level,
        j.employment_type,
        j.salary_min,
        j.salary_max
      FROM agent_progress ap
      JOIN jobPostings j ON ap.job_id = j.id
      WHERE ap.user_id = $1
      AND ap.is_match = true
      ORDER BY 
        ap.confidence_score DESC,
        j.created_at DESC,
        ap.processed_at DESC
      LIMIT 50
    `, [userId]);

    return NextResponse.json({ 
      matches: results.rows,
      count: results.rows.length
    });
  } catch (error) {
    console.error('Error fetching agent matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}