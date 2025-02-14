import { query } from '@/lib/pgdb';
import { NextResponse } from 'next/server';
import { generateAuthToken, updateGithubUserAction } from '@/app/actions/auth';

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
            // Connection flow - update existing user using the new action
            const updateResult = await updateGithubUserAction(userId, {
                username: userData.login,
                id: userData.id,
                access_token: tokenData.access_token,
                avatar_url: userData.avatar_url
            });

            if (updateResult.error) {
                return NextResponse.redirect(`${APP_URL}/profile?error=${encodeURIComponent(updateResult.error)}`);
            }

            return NextResponse.redirect(`${APP_URL}/profile?github=connected`);
        } else {
            // Login flow - check if user exists
            const existingUser = await query(
                `SELECT id FROM users WHERE github_user = $1 OR email = $2`,
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

            // Existing user - update GitHub info using the new action
            const updateResult = await updateGithubUserAction(existingUser.rows[0].id, {
                username: userData.login,
                id: userData.id,
                access_token: tokenData.access_token,
                avatar_url: userData.avatar_url
            });

            if (updateResult.error) {
                return NextResponse.redirect(`${APP_URL}/login?error=${encodeURIComponent(updateResult.error)}`);
            }

            // Redirect with token
            return NextResponse.redirect(`${APP_URL}/login?token=${updateResult.token}`);
        }
    } catch (error) {
        console.error('GitHub auth error:', error);
        const redirectUrl = userId 
            ? `${APP_URL}/profile?error=github_auth_failed&message=${encodeURIComponent(error.message)}`
            : `${APP_URL}/login?error=github_auth_failed&message=${encodeURIComponent(error.message)}`;
        return NextResponse.redirect(redirectUrl);
    }
}
