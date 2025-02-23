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

        const countQuery = `
            SELECT 
                at.id as task_id,
                COUNT(an.id) as notes_count
            FROM agent_tasks at
            LEFT JOIN agent_notes an ON at.id = an.agent_task_id
            WHERE at.user_id = $1
            GROUP BY at.id
        `;

        const result = await query(countQuery, [userId]);
        const counts = result.rows.reduce((acc, row) => {
            acc[row.task_id] = row.notes_count;
            return acc;
        }, {});

        return NextResponse.json({ counts });
    } catch (error) {
        console.error('Error counting agent notes:', error);
        return NextResponse.json({ error: 'Failed to count agent notes' }, { status: 500 });
    }
}
