import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { explainFurther } from '@/services/agentProcessor';

export async function GET(req, { params }) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        verifyToken(token);

        const noteId = parseInt(params.noteId);
        if (isNaN(noteId)) {
            return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
        }

        const explanation = await explainFurther(noteId);
        return NextResponse.json(explanation);
    } catch (error) {
        console.error('Error getting detailed explanation:', error);
        return NextResponse.json({ error: 'Failed to get explanation' }, { status: 500 });
    }
}