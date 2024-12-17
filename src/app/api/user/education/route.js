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
            `SELECT * FROM user_education 
             WHERE user_id = $1 
             ORDER BY is_current DESC, institution_name, start_date DESC`,
            [userId]
        );

        return NextResponse.json({ education: result.rows });
    } catch (error) {
        console.error('Error fetching education:', error);
        return NextResponse.json({ error: 'Error fetching education' }, { status: 500 });
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

        const education = await req.json();

        const insertQuery = `
            INSERT INTO user_education (
                user_id, institution_name, degree, field_of_study,
                start_date, end_date, is_current, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;

        const result = await query(insertQuery, [
            userId,
            education.institution_name,
            education.degree,
            education.field_of_study,
            education.start_date,
            education.end_date,
            education.is_current,
            education.description
        ]);

        return NextResponse.json({ 
            message: 'Education added successfully',
            id: result.rows[0].id 
        });
    } catch (error) {
        console.error('Error adding education:', error);
        return NextResponse.json({ error: 'Error adding education' }, { status: 500 });
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

        const { id, ...education } = await req.json();

        const updateQuery = `
            UPDATE user_education 
            SET institution_name = $1,
                degree = $2,
                field_of_study = $3,
                start_date = $4,
                end_date = $5,
                is_current = $6,
                description = $7
            WHERE id = $8 AND user_id = $9
        `;

        await query(updateQuery, [
            education.institution_name,
            education.degree,
            education.field_of_study,
            education.start_date,
            education.end_date,
            education.is_current,
            education.description,
            id,
            userId
        ]);

        return NextResponse.json({ message: 'Education updated successfully' });
    } catch (error) {
        console.error('Error updating education:', error);
        return NextResponse.json({ error: 'Error updating education' }, { status: 500 });
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
            DELETE FROM user_education 
            WHERE id = $1 AND user_id = $2
        `;

        await query(deleteQuery, [id, userId]);

        return NextResponse.json({ message: 'Education deleted successfully' });
    } catch (error) {
        console.error('Error deleting education:', error);
        return NextResponse.json({ error: 'Error deleting education' }, { status: 500 });
    }
};