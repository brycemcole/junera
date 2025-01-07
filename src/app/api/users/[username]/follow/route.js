import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

// Check if following
export async function GET(req, { params }) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ isFollowing: false });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const followerId = decoded.id;

        const username = await params.username;

        // Get the target user's ID
        const userResult = await query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );


        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const followedId = userResult.rows[0].id;

        // Check if already following
        const followResult = await query(
            `SELECT 1 FROM user_relationships 
             WHERE follower_id = $1 AND followed_id = $2`,
            [followerId, followedId]
        );

        return NextResponse.json({
            isFollowing: followResult.rows.length > 0
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Follow user
export async function POST(req, { params }) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const followerId = decoded.id;
        const username = params.username;
        console.log('Searching for username:', username);

        // Get target user's ID
        const userResult = await query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        console.log('Query parameters:', [username]);
        console.log('Full user result:', userResult);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const followedId = userResult.rows[0].id;

        // Prevent self-following
        if (followerId === followedId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Create follow relationship
        await query(
            `INSERT INTO user_relationships (follower_id, followed_id)
             VALUES ($1, $2)
             ON CONFLICT (follower_id, followed_id) DO NOTHING`,
            [followerId, followedId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error following user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Unfollow user
export async function DELETE(req, { params }) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        const followerId = decoded.id;
        const username = await params.username;

        // Get target user's ID
        const userResult = await query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const followedId = userResult.rows[0].id;

        // Delete follow relationship
        await query(
            `DELETE FROM user_relationships 
             WHERE follower_id = $1 AND followed_id = $2`,
            [followerId, followedId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
