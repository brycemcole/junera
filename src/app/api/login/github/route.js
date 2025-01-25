import { query } from '@/lib/pgdb';
import jwt from 'jsonwebtoken';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return new Response('No code provided', { status: 400 });
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
            throw new Error(tokenData.error_description);
        }

        // Get user data from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        // Get user's email
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
        });

        const emails = await emailResponse.json();
        const primaryEmail = emails.find(email => email.primary)?.email || emails[0]?.email;

        // Check if user exists
        let result = await query(
            'SELECT * FROM users WHERE email = $1 OR github_id = $2',
            [primaryEmail, userData.id]
        );

        let user;

        if (result.rows.length === 0) {
            // Create new user
            result = await query(
                `INSERT INTO users (
          username, email, full_name, github_id, avatar, created_at, last_login
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *`,
                [
                    userData.login,
                    primaryEmail,
                    userData.name || userData.login,
                    userData.id,
                    userData.avatar_url,
                ]
            );
            user = result.rows[0];
        } else {
            user = result.rows[0];
            // Update existing user
            await query(
                `UPDATE users SET 
          last_login = NOW(),
          avatar = COALESCE($1, avatar)
        WHERE id = $2`,
                [userData.avatar_url, user.id]
            );
        }

        // Generate JWT token
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.full_name,
            avatar: user.avatar,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        }, SECRET_KEY);

        // Redirect with token
        return Response.redirect(`${process.env.NEXT_PUBLIC_API_URL}?token=${token}`);
    } catch (error) {
        console.error('GitHub auth error:', error);
        return Response.redirect(`${process.env.NEXT_PUBLIC_API_URL}/login?error=github_auth_failed`);
    }
}
