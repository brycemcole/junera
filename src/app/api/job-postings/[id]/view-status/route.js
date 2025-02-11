import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import { verify } from 'jsonwebtoken';
import { getCached, setCached } from '@/lib/cache';
import { set } from 'date-fns';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get('authorization');
        
        if (!authHeader) {
            console.log('No auth header found');
            return NextResponse.json({ isViewed: false });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        const cacheKey = `view-status-${userId}-${id}`;
        const cached = await getCached(cacheKey);

        if (cached) {
            console.log('Cache hit:', cached);
            return NextResponse.json({ isViewed: cached });
        }

        const result = await query(
            'SELECT EXISTS(SELECT 1 FROM user_interactions WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = $3)',
            [userId, id, 'view']
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ isViewed: false });
        }

        setCached(cacheKey, result.rows[0].exists);

        return NextResponse.json({ isViewed: result.rows[0].exists });
    } catch (error) {
        console.error('Error checking view status:', error);
        return NextResponse.json({ isViewed: false, error: error.message });
    }
}

export const dynamic = 'force-dynamic';
