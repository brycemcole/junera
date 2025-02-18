import { query } from '@/lib/pgdb';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        return NextResponse.redirect('/profile?error=github_no_code');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();

        // Get GitHub user data
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        // Update user record with GitHub info
        await query(
            `UPDATE users 
             SET github_user = $1, 
                 github_access_token = $2
             WHERE id = $3`,
            [userData.login, userData.id, state]
        );

        return NextResponse.redirect('/profile?github=connected');
    } catch (error) {
        console.error('GitHub auth error:', error);
        return NextResponse.redirect('/profile?error=github_auth_failed');
    }
}
