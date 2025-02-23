import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { explainFurther } from '@/services/agentProcessor';

export async function GET(req, { params }) {
    try {
        const paramNoteId = await params.noteId;
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        verifyToken(token);

        const noteId = parseInt(paramNoteId);
        if (isNaN(noteId)) {
            return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
        }

        const stream = await explainFurther(noteId);
        
        // Return the stream with proper headers for SSE
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error getting detailed explanation:', error);
        return NextResponse.json({ error: 'Failed to get explanation' }, { status: 500 });
    }
}