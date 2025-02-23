import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        // Get pagination params from URL
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;

        // Query now includes detailed_explanation
        const notesQuery = `
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
            WHERE at.user_id = $1
            ORDER BY an.id DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await query(notesQuery, [userId, limit, offset]);

        // Format the response to include detailed explanations
        const formattedNotes = result.rows.map(note => ({
            ...note,
            hasDetailedExplanation: !!note.detailed_explanation
        }));

        return NextResponse.json({ 
            data: formattedNotes,
            page,
            limit,
            hasMore: result.rows.length === limit
        });
    } catch (error) {
        console.error('Error fetching agent notes:', error);
        return NextResponse.json({ error: 'Failed to fetch agent notes' }, { status: 500 });
    }
}