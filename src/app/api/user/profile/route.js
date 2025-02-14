import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getCached, setCached, clearCache } from '@/lib/cache';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        // Try to get cached profile
        try {
            const cacheKey = `user-profile:${userId}`;
            const cachedProfile = await getCached(cacheKey);
            if (cachedProfile) {
                return NextResponse.json(cachedProfile);
            }
        } catch (cacheError) {
            console.error('Cache retrieval error:', cacheError);
        }

        // Combined query using CTEs for fetching user profile data
        const queryText = `
            WITH UserInfo AS (
                SELECT 
                    username, full_name, headline, email, phone_number, profile_links,
                    is_premium, job_prefs_title, job_prefs_location, job_prefs_skills,
                    job_prefs_industry, job_prefs_language, job_prefs_salary, job_prefs_relocatable,
                    job_prefs_level, avatar, github_user, github_access_token
                FROM users
                WHERE id = $1
            ),
            Education AS (
                SELECT 
                    id, institution_name, degree, field_of_study, start_date,
                    end_date, is_current, description
                FROM user_education
                WHERE user_id = $1
            ),
            Certifications AS (
                SELECT 
                    id, certification_name, issuing_organization, issue_date, 
                    expiration_date, credential_id, credential_url
                FROM user_certifications
                WHERE user_id = $1
            ),
            WorkExperience AS (
                SELECT 
                    id, company_name, job_title, start_date, end_date, 
                    location, is_current, description
                FROM user_job_experience
                WHERE user_id = $1
            ),
            Projects AS (
                SELECT 
                    id, project_name, start_date, end_date, is_current, 
                    description, technologies_used, project_url, github_url,
                    producthunt_url
                FROM user_projects
                WHERE user_id = $1
            ),
            Awards AS (
                SELECT 
                    id, award_name, award_issuer, award_date, award_url, 
                    award_id, award_description, user_id
                FROM user_awards
                WHERE user_id = $1
            )
            SELECT 
                (SELECT row_to_json(UserInfo) FROM UserInfo) as userdata,
                (SELECT json_agg(Education) FROM Education) as educationdata,
                (SELECT json_agg(Certifications) FROM Certifications) as certificationdata,
                (SELECT json_agg(WorkExperience) FROM WorkExperience) as experiencedata,
                (SELECT json_agg(Projects) FROM Projects) as projectdata,
                (SELECT json_agg(Awards) FROM Awards) as awarddata;
        `;

        const result = await query(queryText, [userId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const { userdata, educationdata, certificationdata, experiencedata, projectdata, awarddata } = result.rows[0];
        const profile = {
            user: userdata || {},
            education: educationdata || [],
            certifications: certificationdata || [],
            experience: experiencedata || [],
            projects: projectdata || [],
            awards: awarddata || []
        };

        // Cache the profile
        try {
            const cacheKey = `user-profile:${userId}`;
            await setCached(cacheKey, profile);
        } catch (cacheError) {
            console.error('Cache set error:', cacheError);
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Error fetching profile data' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const updates = await req.json();
        
        // Convert arrays to PostgreSQL array format with proper quoting
        const formatArray = (arr) => {
            if (!arr) return null;
            const values = Array.isArray(arr) ? arr : [arr];
            // Double quote each value and wrap in array braces
            return `{${values.map(v => `"${v}"`).join(',')}}`;
        };

        const jobPrefsTitle = formatArray(updates.job_prefs_title);
        const jobPrefsLocation = formatArray(updates.job_prefs_location);
        const jobPrefsLevel = formatArray(updates.job_prefs_level);

        // Ensure salary is a number
        const jobPrefsSalary = updates.job_prefs_salary 
            ? parseInt(updates.job_prefs_salary, 10) 
            : null;

        // Convert relocatable to boolean
        const jobPrefsRelocatable = updates.job_prefs_relocatable === true 
            || updates.job_prefs_relocatable === 'true';

        // Update query with proper type casting for arrays
        const updateQuery = `
            UPDATE users
            SET 
                full_name = COALESCE($1, full_name),
                headline = COALESCE($2, headline),
                email = COALESCE($3, email),
                phone_number = $4,
                profile_links = $5,
                job_prefs_title = $6::text[],
                job_prefs_location = $7::text[],
                job_prefs_skills = $8,
                job_prefs_industry = $9,
                job_prefs_language = $10,
                job_prefs_salary = $11,
                job_prefs_relocatable = $12,
                job_prefs_level = $13::text[]
            WHERE id = $14
            RETURNING *;
        `;

        const params = [
            updates.full_name || null,
            updates.headline || null,
            updates.email || null,
            updates.phone_number || null,
            updates.profile_links || null,
            jobPrefsTitle,
            jobPrefsLocation,
            updates.job_prefs_skills || null,
            updates.job_prefs_industry || null,
            updates.job_prefs_language || null,
            jobPrefsSalary,
            jobPrefsRelocatable,
            jobPrefsLevel,
            userId
        ];

        const result = await query(updateQuery, params);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Clear the cache after successful update
        try {
            const cacheKey = `user-profile:${userId}`;
            await clearCache(cacheKey);
        } catch (cacheError) {
            console.error('Cache clear error:', cacheError);
        }

        return NextResponse.json({ 
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: 'Error updating profile data' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';