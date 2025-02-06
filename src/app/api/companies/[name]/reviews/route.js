import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

// Get reviews for a company
export async function GET(req, { params }) {
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.SESSION_SECRET);
            userId = decoded.id;
            console.log('Current user ID:', userId); // Debug log
        } catch (error) {
            console.error('Token verification failed:', error);
        }
    }

    try {
        const name = await params.name;
        const companyName = decodeURIComponent(name);

        // Modified query to properly handle is_own_review
        const reviewsResult = await query(`
            SELECT 
                ci.id,
                ci.rating,
                ci.comment,
                ci.created_at,
                ci.updated_at,
                ci.user_id,
                u.username,
                u.avatar,
                CASE 
                    WHEN ci.user_id = $2 THEN true 
                    ELSE false 
                END as is_own_review
            FROM company_interactions ci
            JOIN companies c ON ci.company_id = c.id
            JOIN users u ON ci.user_id = u.id
            WHERE c.company_name = $1
            AND ci.comment IS NOT NULL
            ORDER BY 
                CASE WHEN ci.user_id = $2 THEN 0 ELSE 1 END,
                ci.created_at DESC
        `, [companyName, userId || null]);

        console.log('Reviews result:', reviewsResult.rows); // Debug log

        return NextResponse.json({
            reviews: reviewsResult.rows
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Add a review
export async function POST(req, { params }) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;
        const name = await params.name;
        const companyName = decodeURIComponent(name);
        const { rating, comment } = await req.json();

        if (!rating || !comment) {
            return NextResponse.json({ error: 'Rating and comment are required' }, { status: 400 });
        }

        // Get company ID
        let companyResult = await query(
            'SELECT id FROM companies WHERE company_name = $1',
            [companyName]
        );

        let companyId;
        if (companyResult.rows.length === 0) {
            // Create company if it doesn't exist
            companyResult = await query(
                'INSERT INTO companies (company_name) VALUES ($1) RETURNING id',
                [companyName]
            );
        }
        companyId = companyResult.rows[0].id;

        // Add or update review
        await query(`
            INSERT INTO company_interactions 
                (user_id, company_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, company_id)
            DO UPDATE SET 
                rating = EXCLUDED.rating,
                comment = EXCLUDED.comment,
                updated_at = NOW()
        `, [userId, companyId, rating, comment]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding review:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Add DELETE method
export async function DELETE(req, { params }) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;
        const { searchParams } = new URL(req.url);
        const reviewId = searchParams.get('reviewId');

        const deleteResult = await query(
            `DELETE FROM company_interactions 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [reviewId, userId]
        );

        if (deleteResult.rowCount === 0) {
            return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
