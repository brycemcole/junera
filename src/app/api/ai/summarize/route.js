import { verifyToken } from '@/lib/auth';
import aiAgent from '@/services/aiAgent';
import { clearCache } from '@/lib/cache';

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { jobPosting } = await request.json();
        
        // Get the streaming response from AIAgent
        const stream = await aiAgent.summarizeJobPosting(jobPosting);

        // Clear the cache for this job posting
        await clearCache(`job-posting:${jobPosting.job_id}`);

        // Return the stream directly
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Error in AI route:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export const dynamic = 'force-dynamic';