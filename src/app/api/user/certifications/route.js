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
            `SELECT * FROM user_certifications 
             WHERE user_id = $1 
             ORDER BY issue_date DESC`,
            [userId]
        );

        return NextResponse.json({ certifications: result.rows });
    } catch (error) {
        console.error('Error fetching certifications:', error);
        return NextResponse.json({ error: 'Error fetching certifications' }, { status: 500 });
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

        const certification = await req.json();

        const insertQuery = `
            INSERT INTO user_certifications (
                user_id, certification_name, issuing_organization, 
                issue_date, expiration_date, credential_id, credential_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const result = await query(insertQuery, [
            userId,
            certification.certification_name,
            certification.issuing_organization,
            certification.issue_date,
            certification.expiration_date,
            certification.credential_id,
            certification.credential_url
        ]);

        return NextResponse.json({
            message: 'Certification added successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error adding certification:', error);
        return NextResponse.json({ error: 'Error adding certification' }, { status: 500 });
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

        const { id, ...certification } = await req.json();

        const updateQuery = `
            UPDATE user_certifications 
            SET certification_name = $1,
                issuing_organization = $2,
                issue_date = $3,
                expiration_date = $4,
                credential_id = $5,
                credential_url = $6
            WHERE id = $7 AND user_id = $8
        `;

        await query(updateQuery, [
            certification.certification_name,
            certification.issuing_organization,
            certification.issue_date,
            certification.expiration_date,
            certification.credential_id,
            certification.credential_url,
            id,
            userId
        ]);

        return NextResponse.json({ message: 'Certification updated successfully' });
    } catch (error) {
        console.error('Error updating certification:', error);
        return NextResponse.json({ error: 'Error updating certification' }, { status: 500 });
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
            DELETE FROM user_certifications 
            WHERE id = $1 AND user_id = $2
        `;

        await query(deleteQuery, [id, userId]);

        return NextResponse.json({ message: 'Certification deleted successfully' });
    } catch (error) {
        console.error('Error deleting certification:', error);
        return NextResponse.json({ error: 'Error deleting certification' }, { status: 500 });
    }
};
