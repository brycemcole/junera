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

    // Get matches from agent_tasks with job information
    const results = await query(`
      SELECT 
        at.id as match_id,
        at.search_title,
        at.search_location,
        at.search_experience_level,
        at.agent_notes[array_upper(at.agent_notes, 1)] as latest_note,
        j.*
      FROM agent_tasks at
      CROSS JOIN UNNEST(at.processed_job_ids) WITH ORDINALITY AS job_id_arr(job_id, idx)
      JOIN jobPostings j ON j.job_id = job_id_arr.job_id
      WHERE at.user_id = $1
      AND at.agent_notes[job_id_arr.idx] ILIKE '%good match%'
      ORDER BY 
        job_id_arr.idx DESC,
        j.created_at DESC
      LIMIT 50
    `, [userId]);

    // Transform the results to match expected format
    const matches = results.rows.map(row => ({
      ...row,
      match_reason: row.latest_note,
      confidence_score: 0.8 // Default confidence score since we don't store this
    }));

    return NextResponse.json({ 
      matches,
      count: matches.length
    });
  } catch (error) {
    console.error('Error fetching agent matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}