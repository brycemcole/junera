import { query } from '@/lib/pgdb';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.junera.us';
const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');

    console.log('GitHub callback received:', { code, userId });

    if (!code) {
        return NextResponse.redirect(`${APP_URL}/profile?error=github_no_code`);
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

        // Get user's email
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        const emails = await emailResponse.json();
        const primaryEmail = emails.find(email => email.primary)?.email || emails[0]?.email;

        if (userId) {
            // Connection flow - update existing user
            const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
            if (userCheck.rows.length === 0) {
                console.error('User not found:', userId);
                return NextResponse.redirect(`${APP_URL}/profile?error=invalid_user`);
            }

            await query(
                `UPDATE users 
                 SET github_user = $1, 
                     github_access_token = $2,
                     updated_at = NOW()
                 WHERE id = $3`,
                [userData.login, tokenData.access_token, userId]
            );

            return NextResponse.redirect(`${APP_URL}/profile?github=connected`);
        } else {
            // Login flow - check if user exists
            const existingUser = await query(
                'SELECT * FROM users WHERE github_user = $1 OR email = $2',
                [userData.login, primaryEmail]
            );

            if (existingUser.rows.length === 0) {
                // No existing user - redirect to registration with GitHub data
                const githubData = {
                    github_id: userData.id,
                    email: primaryEmail,
                    username: userData.login,
                    full_name: userData.name || userData.login,
                    avatar_url: userData.avatar_url,
                    access_token: tokenData.access_token
                };
                const encoded = Buffer.from(JSON.stringify(githubData)).toString('base64');
                return NextResponse.redirect(`${APP_URL}/register?github_data=${encoded}`);
            }

            // Existing user - update GitHub info and generate JWT
            const user = existingUser.rows[0];
            await query(
                `UPDATE users 
                 SET github_user = $1, 
                     github_access_token = $2,
                     last_login = NOW(),
                     updated_at = NOW()
                 WHERE id = $3`,
                [userData.login, tokenData.access_token, user.id]
            );

            // Generate JWT token
            const token = jwt.sign({
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name,
                avatar: user.avatar,
                githubUsername: userData.login,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            }, SECRET_KEY);

            // Redirect with token
            return NextResponse.redirect(`${APP_URL}/login?token=${token}`);
        }
    } catch (error) {
        console.error('GitHub auth error:', error);
        const redirectUrl = userId 
            ? `${APP_URL}/profile?error=github_auth_failed&message=${encodeURIComponent(error.message)}`
            : `${APP_URL}/login?error=github_auth_failed&message=${encodeURIComponent(error.message)}`;
        return NextResponse.redirect(redirectUrl);
    }
}
