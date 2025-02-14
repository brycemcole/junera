import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
    try {
        const authHeader = req.headers.get('Authorization');
        let currentUserId = null;

        // Get current user's ID if they're authenticated
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.SESSION_SECRET);
                currentUserId = decoded.id;
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }

        const username = params.username;
        
        // Get user's basic info and related counts
        const userResult = await query(`
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.github_user,
                u.headline,
                u.avatar as avatar_url,
                u.job_prefs_title,
                u.job_prefs_location,
                u.job_prefs_level,
                COUNT(DISTINCT uje.id) as experience_count,
                COUNT(DISTINCT ue.id) as education_count,
                COUNT(DISTINCT uc.id) as certification_count,
                COUNT(DISTINCT up.id) as project_count
            FROM users u
            LEFT JOIN user_job_experience uje ON u.id = uje.user_id
            LEFT JOIN user_education ue ON u.id = ue.user_id
            LEFT JOIN user_certifications uc ON u.id = uc.user_id
            LEFT JOIN user_projects up ON u.id = up.user_id
            WHERE LOWER(u.username) = LOWER($1)
            GROUP BY u.id
        `, [username]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];

        // Get all the user's public data
        const [experienceResult, educationResult, certificationsResult, projectsResult] = await Promise.all([
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
                    is_current,
                    description
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
            `, [user.id]),
            query(`
                SELECT 
                    id,
                    project_name,
                    start_date,
                    end_date,
                    is_current,
                    description,
                    technologies_used,
                    project_url,
                    github_url,
                    producthunt_url
                FROM user_projects 
                WHERE user_id = $1 
                ORDER BY is_current DESC, start_date DESC
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
            certifications: certificationsResult.rows,
            projects: projectsResult.rows
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
