import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const result = await query(
            `SELECT * FROM user_job_experience 
             WHERE user_id = $1 
             ORDER BY is_current DESC, company_name, start_date DESC`,
            [userId]
        );

        return NextResponse.json({ experiences: result.rows });
    } catch (error) {
        console.error('Error fetching experiences:', error);
        return NextResponse.json({ error: 'Error fetching experiences' }, { status: 500 });
    }
};

export const POST = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const experience = await req.json();

        const insertQuery = `
            INSERT INTO user_job_experience (
                user_id, company_name, job_title, start_date, 
                end_date, location, is_current, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;

        const result = await query(insertQuery, [
            userId,
            experience.company_name,
            experience.job_title,
            experience.start_date,
            experience.end_date,
            experience.location,
            experience.is_current,
            experience.description
        ]);

        return NextResponse.json({ 
            message: 'Experience added successfully',
            id: result.rows[0].id 
        });
    } catch (error) {
        console.error('Error adding experience:', error);
        return NextResponse.json({ error: 'Error adding experience' }, { status: 500 });
    }
};

export const PUT = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const { id, ...experience } = await req.json();

        const updateQuery = `
            UPDATE user_job_experience 
            SET company_name = $1,
                job_title = $2,
                start_date = $3,
                end_date = $4,
                location = $5,
                is_current = $6,
                description = $7
            WHERE id = $8 AND user_id = $9
        `;

        await query(updateQuery, [
            experience.company_name,
            experience.job_title,
            experience.start_date,
            experience.end_date,
            experience.location,
            experience.is_current,
            experience.description,
            id,
            userId
        ]);

        return NextResponse.json({ message: 'Experience updated successfully' });
    } catch (error) {
        console.error('Error updating experience:', error);
        return NextResponse.json({ error: 'Error updating experience' }, { status: 500 });
    }
};

export const DELETE = async (req) => {
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
            DELETE FROM user_job_experience 
            WHERE id = $1 AND user_id = $2
        `;

        await query(deleteQuery, [id, userId]);

        return NextResponse.json({ message: 'Experience deleted successfully' });
    } catch (error) {
        console.error('Error deleting experience:', error);
        return NextResponse.json({ error: 'Error deleting experience' }, { status: 500 });
    }
};