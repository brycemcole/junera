import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/cache';

export async function DELETE(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        // Clear the cache before updating
        try {
            const cacheKey = `user-profile:${userId}`;
            await clearCache(cacheKey);
        } catch (cacheError) {
            console.error('Cache clear error:', cacheError);
        }

        // Update user to remove GitHub information
        const result = await query(`
            UPDATE users 
            SET github_user = NULL,
                github_id = NULL,
                github_access_token = NULL,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, username, full_name, avatar, github_user;
        `, [userId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'GitHub account disconnected successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error disconnecting GitHub account:', error);
        return NextResponse.json({ error: 'Error disconnecting GitHub account' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
