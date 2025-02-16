'use server';

import { query } from '@/lib/pgdb';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { getCached, setCached } from '@/lib/cache';

export async function trackJobView(jobId) {
    try {
        const token = cookies().get('token')?.value;
        if (!token) return false;

        const decoded = verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        const cacheKey = `view-status-${userId}-${jobId}`;

        // Begin transaction
        await query('BEGIN');

        try {
            // Update view count
            await query(
                'UPDATE jobPostings SET views = COALESCE(views, 0) + 1 WHERE job_id = $1',
                [jobId]
            );

            // Log interaction without updating existing dates
            await query(`
                INSERT INTO user_interactions (user_id, job_posting_id, interaction_type, interaction_date)
                VALUES ($1, $2, 'view', NOW())
                ON CONFLICT (user_id, job_posting_id, interaction_type) 
                DO NOTHING
            `, [userId, jobId]);

            // Get the actual view date
            const viewDate = await query(`
                SELECT interaction_date 
                FROM user_interactions 
                WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = 'view'
            `, [userId, jobId]);

            await query('COMMIT');
            await setCached(cacheKey, { 
                isViewed: true, 
                viewedAt: viewDate.rows[0]?.interaction_date || new Date() 
            });
            return true;
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error tracking job view:', error);
        return false;
    } finally {
        await query('END');
    }
}
