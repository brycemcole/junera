import { query } from "@/lib/pgdb";
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { processJobPostings } from "@/lib/job-utils";

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        // Directly query user preferences instead of making an HTTP call
        const userQuery = `
            SELECT 
                job_prefs_title,
                job_prefs_location,
                job_prefs_industry,
                job_prefs_experience_level,
                job_prefs_salary
            FROM users 
            WHERE id = $1
        `;

        const userResult = await query(userQuery, [userId]);
        if (!userResult.rows.length) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userPrefs = userResult.rows[0];

        // Build job search query with simpler matching
        let jobsQuery = `
            WITH UserPrefs AS (
                SELECT 
                    job_prefs_title,
                    job_prefs_location,
                    job_prefs_industry,
                    job_prefs_experience_level,
                    job_prefs_salary
                FROM users 
                WHERE id = $1
            )
            SELECT DISTINCT ON (j.job_id)
                j.id,
                j.job_id,
                j.source_url,
                j.experiencelevel,
                j.title,
                j.company,
                j.location,
                j.description,
                j.created_at,
                CASE
                    WHEN LOWER(j.title) LIKE LOWER(CONCAT('%', up.job_prefs_title, '%')) THEN 3
                    WHEN LOWER(j.description) LIKE LOWER(CONCAT('%', up.job_prefs_industry, '%')) THEN 2
                    WHEN LOWER(j.description) LIKE LOWER(CONCAT('%', up.job_prefs_title, '%')) THEN 1
                    ELSE 0
                END as relevance_score
            FROM jobPostings j
            CROSS JOIN UserPrefs up
            WHERE 1=1
        `;

        const params = [userId];
        let paramIndex = 2;

        // Add flexible conditions
        jobsQuery += `
            AND (
                -- Title or description contains preferred title
                LOWER(j.title) LIKE LOWER(CONCAT('%', up.job_prefs_title, '%'))
                OR LOWER(j.description) LIKE LOWER(CONCAT('%', up.job_prefs_title, '%'))
                -- Or industry match if specified
                OR (
                    up.job_prefs_industry IS NOT NULL 
                    AND LOWER(j.description) LIKE LOWER(CONCAT('%', up.job_prefs_industry, '%'))
                )
            )
        `;

        // Location matching (if specified and valid)
        if (typeof userPrefs.job_prefs_location === 'string' && userPrefs.job_prefs_location.trim() !== '') {
            jobsQuery += `
                AND (
                    LOWER(j.location) LIKE $${paramIndex} 
                    OR LOWER(j.location) LIKE '%remote%'
                )
            `;
            params.push(`%${userPrefs.job_prefs_location.toLowerCase()}%`);
            paramIndex++;
        }

        // Experience level matching (if specified and valid)
        if (typeof userPrefs.job_prefs_experience_level === 'string' && userPrefs.job_prefs_experience_level.trim() !== '') {
            jobsQuery += ` AND LOWER(j.experiencelevel) LIKE $${paramIndex}`;
            params.push(`%${userPrefs.job_prefs_experience_level.toLowerCase()}%`);
            paramIndex++;
        }

        // Modify ORDER BY to include DISTINCT ON expressions first
        jobsQuery += `
            ORDER BY 
                j.job_id,           -- Must match DISTINCT ON (j.job_id)
                relevance_score DESC,
                j.created_at DESC
            LIMIT $${paramIndex} 
            OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        const jobsResult = await query(jobsQuery, params);
        const jobPostings = processJobPostings(jobsResult.rows);

        // Optionally, order the final results by relevance_score DESC if needed
        // jobPostings.sort((a, b) => b.relevance_score - a.relevance_score);

        return NextResponse.json({
            jobPostings,
            page,
            limit
        });

    } catch (error) {
        console.error("Error fetching suggested jobs:", error);
        return NextResponse.json(
            { error: "Error fetching suggested jobs" },
            { status: 500 }
        );
    }
}