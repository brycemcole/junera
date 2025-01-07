import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

// Get follow status
export async function GET(req, { params }) {
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

        // First get company ID
        const companyResult = await query(
            'SELECT id FROM companies WHERE company_name = $1',
            [companyName]
        );

        if (companyResult.rows.length === 0) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const companyId = companyResult.rows[0].id;

        // Check if following
        const followResult = await query(
            `SELECT is_following 
             FROM company_interactions 
             WHERE user_id = $1 AND company_id = $2`,
            [userId, companyId]
        );

        return NextResponse.json({
            isFollowing: followResult.rows.length > 0 && followResult.rows[0].is_following
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Follow company
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

        // First check if company exists
        let companyResult = await query(
            'SELECT id FROM companies WHERE company_name = $1',
            [companyName]
        );

        let companyId;

        if (companyResult.rows.length === 0) {
            // Create new company if it doesn't exist
            companyResult = await query(
                'INSERT INTO companies (company_name) VALUES ($1) RETURNING id',
                [companyName]
            );
        }

        companyId = companyResult.rows[0].id;

        // Create or update interaction
        await query(
            `INSERT INTO company_interactions (user_id, company_id, is_following)
             VALUES ($1, $2, true)
             ON CONFLICT (user_id, company_id) 
             DO UPDATE SET is_following = true, updated_at = NOW()`,
            [userId, companyId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error following company:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

// Unfollow company
export async function DELETE(req, { params }) {
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

        const companyResult = await query(
            'SELECT id FROM companies WHERE company_name = $1',
            [companyName]
        );

        if (companyResult.rows.length === 0) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const companyId = companyResult.rows[0].id;

        await query(
            `UPDATE company_interactions 
             SET is_following = false, updated_at = NOW()
             WHERE user_id = $1 AND company_id = $2`,
            [userId, companyId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unfollowing company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
