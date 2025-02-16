import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import { verify } from 'jsonwebtoken';
import { getCached, setCached } from '@/lib/cache';

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
            return NextResponse.json({
                isViewed: cached.isViewed,
                viewedAt: cached.viewedAt
            });
        }

        const result = await query(
            'SELECT EXISTS(SELECT 1 FROM user_interactions WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = $3) as exists, MAX(interaction_date) as viewed_at FROM user_interactions WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = $3 GROUP BY exists',
            [userId, id, 'view']
        );

        const response = {
            isViewed: result.rows[0]?.exists || false,
            viewedAt: result.rows[0]?.viewed_at || null
        };

        setCached(cacheKey, response);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error checking view status:', error);
        return NextResponse.json({ isViewed: false, error: error.message });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const authHeader = req.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json({ isViewed: false, viewedAt: null });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        const cacheKey = `view-status-${userId}-${id}`;
        const currentTime = new Date();

        // Begin transaction
        await query('BEGIN');

        try {
            // Update view count
            await query(
                'UPDATE jobPostings SET views = COALESCE(views, 0) + 1 WHERE job_id = $1',
                [id]
            );

            // Log interaction - Use ON CONFLICT to preserve the original view date
            const result = await query(`
                INSERT INTO user_interactions (user_id, job_posting_id, interaction_type, interaction_date)
                VALUES ($1, $2, 'view', NOW())
                ON CONFLICT (user_id, job_posting_id, interaction_type) 
                DO NOTHING
                RETURNING interaction_date;
            `, [userId, id]);

            // Get the actual view date (whether it was just inserted or already existed)
            const viewDate = await query(`
                SELECT interaction_date 
                FROM user_interactions 
                WHERE user_id = $1 AND job_posting_id = $2 AND interaction_type = 'view'
            `, [userId, id]);

            await query('COMMIT');

            const response = {
                isViewed: true,
                viewedAt: viewDate.rows[0]?.interaction_date || currentTime
            };

            await setCached(cacheKey, response);
            return NextResponse.json(response);

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error updating view status:', error);
        return NextResponse.json({ 
            isViewed: false, 
            viewedAt: null, 
            error: error.message 
        });
    } finally {
        await query('END');
    }
}

export const dynamic = 'force-dynamic';
