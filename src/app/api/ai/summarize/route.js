import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify JWT token
        const token = authHeader.split('Bearer ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { jobPosting, jobId } = await request.json();

        const systemMessage = {
            role: "system",
            content: `
        You are a helpful agent that works for ${jobPosting.company} to provide
        a short sentence about who the ideal candidate for this job is based on the requirements listed.
        You should prioritize requirements that a person can know if they have instantly. 
        EXAMPLE RESPONSE: 'We are seeking a ${jobPosting.title} with 4 years of experience in rust, 2 years in python, and a great attitude.'
      
        Here is the full content of the job posting:
        ${JSON.stringify(jobPosting)}
      `
        };

        const userMessage = {
            role: "user",
            content: `Please provide a brief summary of the job posting titled "${jobPosting.title}" at ${jobPosting.company}.`
        };

        const openai = new OpenAI({
            apiKey: process.env.NVIDIA_KEY,
            baseURL: 'https://integrate.api.nvidia.com/v1',
        });

        // Create response stream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const completion = await openai.chat.completions.create({
                        model: "meta/llama-3.1-405b-instruct",
                        messages: [systemMessage, userMessage],
                        temperature: 0.2,
                        max_tokens: 200,
                        stream: true,
                    });

                    for await (const chunk of completion) {
                        console.log(chunk);
                        // Extract content from the chunk
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            // Format as SSE data
                            const data = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
                            controller.enqueue(new TextEncoder().encode(data));
                        }
                    }
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

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
