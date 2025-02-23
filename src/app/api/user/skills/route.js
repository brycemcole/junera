import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const result = await query(
            `SELECT * FROM entity_skills 
             WHERE user_id = $1
             ORDER BY skill_name`,
            [userId]
        );

        return NextResponse.json({ skills: result.rows });
    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json({ error: 'Error fetching skills' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const { skill_name, entity_type, entity_id } = await req.json();

        const insertQuery = `
            INSERT INTO entity_skills (
                user_id, skill_name, entity_type, entity_id
            ) VALUES ($1, $2, $3, $4)
            RETURNING id
        `;

        const result = await query(insertQuery, [
            userId,
            skill_name,
            entity_type || 'profile',
            entity_id || null
        ]);

        return NextResponse.json({
            message: 'Skill added successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error adding skill:', error);
        return NextResponse.json({ error: 'Error adding skill' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const { id } = await req.json();

        const deleteQuery = `
            DELETE FROM entity_skills 
            WHERE id = $1 AND user_id = $2
        `;

        await query(deleteQuery, [id, userId]);

        return NextResponse.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return NextResponse.json({ error: 'Error deleting skill' }, { status: 500 });
    }
}