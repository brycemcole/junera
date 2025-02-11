import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
    try {
        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;

        // Get current user's ID if they're authenticated
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);
                currentUserId = decoded.id;
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }

        // No need to await params.username since it's already a string
        const username = await params.username;
        console.log('Fetching profile for username:', username); // Debug log

        // Get user's basic info (excluding sensitive information)
        const userResult = await query(`
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.headline,
                u.avatar,
                u.job_prefs_title,
                u.job_prefs_location,
                u.job_prefs_level,
                COUNT(DISTINCT uje.id) as experience_count,
                COUNT(DISTINCT ue.id) as education_count,
                COUNT(DISTINCT uc.id) as certification_count
            FROM users u
            LEFT JOIN user_job_experience uje ON u.id = uje.user_id
            LEFT JOIN user_education ue ON u.id = ue.user_id
            LEFT JOIN user_certifications uc ON u.id = uc.user_id
            WHERE LOWER(u.username) = LOWER($1)
            GROUP BY u.id
        `, [username]);

        console.log('User query result:', userResult.rows); // Debug log

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Get all the user's public data
        const [experienceResult, educationResult, certificationsResult] = await Promise.all([
            query(`
                SELECT 
                    id,
                    company_name,
                    job_title,
                    start_date,
                    end_date,
                    is_current,
                    location,
                    description
                FROM user_job_experience 
                WHERE user_id = $1 
                ORDER BY is_current DESC, start_date DESC
            `, [user.id]),
            query(`
                SELECT 
                    id,
                    institution_name,
                    degree,
                    field_of_study,
                    start_date,
                    end_date,
                    is_current
                FROM user_education 
                WHERE user_id = $1 
                ORDER BY is_current DESC, start_date DESC
            `, [user.id]),
            query(`
                SELECT 
                    id,
                    certification_name,
                    issuing_organization,
                    issue_date,
                    expiration_date,
                    credential_url
                FROM user_certifications 
                WHERE user_id = $1 
                ORDER BY issue_date DESC
            `, [user.id])
        ]);

        // Include whether this profile belongs to the current user
        const isOwnProfile = currentUserId === user.id;

        const response = {
            user: {
                ...user,
                isOwnProfile
            },
            experience: experienceResult.rows,
            education: educationResult.rows,
            certifications: certificationsResult.rows
        };

        console.log('Final response:', response); // Debug log

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}
