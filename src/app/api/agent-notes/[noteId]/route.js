import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';

export async function GET(req, { params }) {
    try {
        const jobId = params.noteId;
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const noteQuery = `
            SELECT 
                an.id,
                an.explanation,
                an.match_score,
                an.detailed_explanation,
                an.job_id,
                jp.title as job_title,
                jp.company,
                jp.location,
                jp.description,
                jp.experiencelevel
            FROM agent_notes an
            JOIN agent_tasks at ON an.agent_task_id = at.id
            JOIN jobpostings jp ON an.job_id = jp.job_id
            WHERE at.user_id = $1 AND an.job_id = $2
            ORDER BY an.id DESC
            LIMIT 1
        `;

        const result = await query(noteQuery, [userId, jobId]);
        
        if (result.rows.length === 0) {
            return NextResponse.json({ success: true, data: null });
        }

        const note = result.rows[0];
        return NextResponse.json({ 
            success: true, 
            data: {
                ...note,
                hasDetailedExplanation: !!note.detailed_explanation
            }
        });
    } catch (error) {
        console.error('Error fetching agent note:', error);
        return NextResponse.json({ error: 'Failed to fetch agent note' }, { status: 500 });
    }
}