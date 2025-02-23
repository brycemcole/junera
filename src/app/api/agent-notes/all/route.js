import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/pgdb';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Fetch all notes without pagination
        const notesQuery = `
            SELECT 
                an.*, 
                jp.title as job_title,
                jp.company,
                jp.location,
                jp.job_id
            FROM agent_notes an
            JOIN jobpostings jp ON an.job_id = jp.job_id
            WHERE an.agent_task_id IN (
                SELECT id FROM agent_tasks WHERE user_id = $1
            )
            ORDER BY an.id DESC
        `;

        const result = await query(notesQuery, [decoded.id]);

        return NextResponse.json({ 
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching all agent notes:', error);
        return NextResponse.json({ error: 'Failed to fetch agent notes' }, { status: 500 });
    }
}