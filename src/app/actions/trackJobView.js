'use server';

import { query } from '@/lib/pgdb';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function trackJobView(jobId) {
    try {
        const token = cookies().get('token')?.value;
        if (!token) return false;

        const decoded = verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        // Begin transaction
        await query('BEGIN');

        try {
            // Update view count
            await query(
                'UPDATE jobPostings SET views = COALESCE(views, 0) + 1 WHERE job_id = $1',
                [jobId]
            );

            // Log interaction - Use ON CONFLICT to handle duplicate views
            await query(`
        INSERT INTO user_interactions (user_id, job_posting_id, interaction_type, interaction_date)
        VALUES ($1, $2, 'view', NOW())
        ON CONFLICT (user_id, job_posting_id, interaction_type) 
        DO UPDATE SET interaction_date = NOW()
        RETURNING id;
      `, [userId, jobId]);

            await query('COMMIT');
            return true;
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error tracking job view:', error);
        return false;
    }
}
