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
            `SELECT * FROM user_awards 
             WHERE user_id = $1 
             ORDER BY award_date DESC`,
            [userId]
        );

        return NextResponse.json({ awards: result.rows });
    } catch (error) {
        console.error('Error fetching awards:', error);
        return NextResponse.json({ error: 'Error fetching awards' }, { status: 500 });
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

        const award = await req.json();

        const insertQuery = `
            INSERT INTO user_awards (
                user_id, award_name, award_issuer, award_date, 
                award_url, award_id, award_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const result = await query(insertQuery, [
            userId,
            award.award_name,
            award.award_issuer,
            award.award_date,
            award.award_url,
            award.award_id,
            award.award_description
        ]);

        return NextResponse.json({
            message: 'Award added successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error adding award:', error);
        return NextResponse.json({ error: 'Error adding award' }, { status: 500 });
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

        const { id, ...award } = await req.json();

        const updateQuery = `
            UPDATE user_awards 
            SET award_name = $1,
                award_issuer = $2,
                award_date = $3,
                award_url = $4,
                award_id = $5,
                award_description = $6
            WHERE id = $7 AND user_id = $8
        `;

        await query(updateQuery, [
            award.award_name,
            award.award_issuer,
            award.award_date,
            award.award_url,
            award.award_id,
            award.award_description,
            id,
            userId
        ]);

        return NextResponse.json({ message: 'Award updated successfully' });
    } catch (error) {
        console.error('Error updating award:', error);
        return NextResponse.json({ error: 'Error updating award' }, { status: 500 });
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
            DELETE FROM user_awards 
            WHERE id = $1 AND user_id = $2
        `;

        await query(deleteQuery, [id, userId]);

        return NextResponse.json({ message: 'Award deleted successfully' });
    } catch (error) {
        console.error('Error deleting award:', error);
        return NextResponse.json({ error: 'Error deleting award' }, { status: 500 });
    }
};
