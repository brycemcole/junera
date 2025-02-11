import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.SESSION_SECRET;

export async function PUT(request) {
    try {
        const preferences = await request.json();
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            // Verify and decode current token
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Remove exp and iat from decoded token before re-signing
            const { exp, iat, ...tokenData } = decoded;

            // Create new token with updated preferences
            const newToken = jwt.sign({
                ...tokenData,
                jobPrefsTitle: preferences.job_prefs_title || tokenData.jobPrefsTitle || [],
                jobPrefsLocation: preferences.job_prefs_location || tokenData.jobPrefsLocation || [],
                jobPrefsLevel: preferences.job_prefs_level || tokenData.jobPrefsLevel || []
            }, JWT_SECRET, { 
                expiresIn: '7d' 
            });

            return NextResponse.json({
                success: true,
                token: newToken,
                preferences: {
                    job_prefs_title: preferences.job_prefs_title || tokenData.jobPrefsTitle || [],
                    job_prefs_location: preferences.job_prefs_location || tokenData.jobPrefsLocation || [],
                    job_prefs_level: preferences.job_prefs_level || tokenData.jobPrefsLevel || []
                }
            });
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return NextResponse.json({ 
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to update preferences'
        }, { status: 500 });
    }
}
