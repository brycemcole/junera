import { query } from '@/lib/pgdb';
import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.junera.us';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');

    console.log('GitHub callback received:', { code, userId });

    if (!code) {
        return NextResponse.redirect(`${APP_URL}/profile?error=github_no_code`);
    }

    if (!userId) {
        return NextResponse.redirect(`${APP_URL}/profile?error=invalid_user`);
    }

    try {
        // Verify user exists
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            console.error('User not found:', userId);
            return NextResponse.redirect(`${APP_URL}/profile?error=invalid_user`);
        }

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
        
        if (tokenData.error) {
            console.error('GitHub token error:', tokenData);
            return NextResponse.redirect(`${APP_URL}/profile?error=github_token_failed&github_error=${encodeURIComponent(tokenData.error)}`);
        }

        // Get GitHub user data
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('GitHub API error:', errorText);
            return NextResponse.redirect(`${APP_URL}/profile?error=github_api_failed`);
        }

        const userData = await userResponse.json();

        // Update user record with GitHub info
        await query(
            `UPDATE users 
             SET github_user = $1, 
                 github_access_token = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [userData.login, tokenData.access_token, userId]
        );

        return NextResponse.redirect(`${APP_URL}/profile?github=connected`);
    } catch (error) {
        console.error('GitHub auth error:', error);
        return NextResponse.redirect(`${APP_URL}/profile?error=github_auth_failed&message=${encodeURIComponent(error.message)}`);
    }
}
