import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import bcrypt from 'bcrypt';
import { verify } from 'jsonwebtoken';

export async function PUT(req) {
    try {
        const { oldPassword, newPassword } = await req.json();
        const authHeader = req.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verify(token, process.env.SESSION_SECRET);
        const userId = decoded.id;

        // Get current password hash
        const result = await query(
            'SELECT password FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify old password
        const isValidPassword = await bcrypt.compare(oldPassword, result.rows[0].password);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}