import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';

export async function GET(req) {
    try {
        // Get random users, excluding the current user if authenticated
        const result = await query(`
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.headline,
                u.avatar,
                COUNT(DISTINCT uje.id) as experience_count,
                COUNT(DISTINCT ue.id) as education_count
            FROM users u
            LEFT JOIN user_job_experience uje ON u.id = uje.user_id
            LEFT JOIN user_education ue ON u.id = ue.user_id
            GROUP BY u.id
            ORDER BY RANDOM()
            LIMIT 3
        `);

        return NextResponse.json({ users: result.rows });
    } catch (error) {
        console.error('Error fetching suggested users:', error);
        return NextResponse.json({ error: 'Failed to fetch suggested users' }, { status: 500 });
    }
}
