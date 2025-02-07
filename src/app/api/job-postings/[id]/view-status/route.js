import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const cookieStore = cookies();
        const token = await cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ isViewed: false });
        }

        const decoded = verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        const result = await query(
            'SELECT EXISTS(SELECT 1 FROM user_interactions WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = $3)',
            [userId, id, 'view']
        );

        return NextResponse.json({ isViewed: result.rows[0].exists });
    } catch (error) {
        console.error('Error checking view status:', error);
        return NextResponse.json({ isViewed: false });
    }
}

export const dynamic = 'force-dynamic';
