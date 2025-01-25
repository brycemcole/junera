import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        await query(
            `UPDATE users 
             SET github_user = NULL, 
                 github_access_token = NULL 
             WHERE id = $1`,
            [userId]
        );

        return NextResponse.json({ message: 'GitHub account disconnected' });
    } catch (error) {
        console.error('Error disconnecting GitHub account:', error);
        return NextResponse.json({ error: 'Failed to disconnect GitHub account' }, { status: 500 });
    }
}
