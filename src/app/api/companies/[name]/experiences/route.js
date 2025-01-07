import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';

export async function GET(req, { params }) {
    try {
        const name = await params.name;
        const companyName = decodeURIComponent(name);

        // Simplified query to only get unique users
        const experiencesResult = await query(`
            SELECT DISTINCT 
                u.id,
                u.username,
                u.avatar
            FROM user_job_experience uje
            JOIN users u ON uje.user_id = u.id
            WHERE LOWER(uje.company_name) = LOWER($1)
            ORDER BY u.username
        `, [companyName]);

        return NextResponse.json({
            experiences: experiencesResult.rows
        });
    } catch (error) {
        console.error('Error fetching company experiences:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
