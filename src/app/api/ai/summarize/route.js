import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
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

        const client = new ModelClient(
            process.env.AZURE_INFERENCE_SDK_ENDPOINT ?? "https://junera-ai-services.services.ai.azure.com/models",
            new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY)
        );

        const response = await client.path("chat/completions").post({
            body: {
                messages: [systemMessage, userMessage],
                max_tokens: 200,
                temperature: 0.2,
                model: process.env.AZURE_DEPLOYMENT_NAME ?? "gpt-4o-mini",
                stream: true,
            },
        });

        // Return the stream directly with SSE headers
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Error in AI route:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Serveokar Error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
