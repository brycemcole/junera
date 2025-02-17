import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';

export async function GET(req, { params }) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { id } = params;
        
        console.log(`Checking analysis for job_id: ${id}, user_id: ${decoded.id}`);

        // First try to get the response
        const result = await query(
            'SELECT response, created_at FROM job_posting_agent_responses WHERE job_posting_id = $1 AND user_id = $2',
            [id, decoded.id]
        );

        console.log('Query result:', result.rows);

        if (result.rows.length === 0) {
            console.log('No analysis found');
            return new Response(JSON.stringify({ exists: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Log the response details
        console.log('Found analysis:', {
            responseLength: result.rows[0].response?.length,
            createdAt: result.rows[0].created_at
        });

        return new Response(JSON.stringify({
            exists: true,
            data: result.rows[0]
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in GET analyze:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Helper function to convert stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
  }
  return chunks.join('');
}

export async function POST(req, { params }) {
    try {
        // Token verification
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Fetch job posting details
        const { id } = params;
        const jobResult = await query(
            'SELECT * FROM jobPostings WHERE job_id = $1',
            [id]
        );
        const jobPosting = jobResult.rows[0];
        if (!jobPosting) {
            return new Response(JSON.stringify({ error: 'Job posting not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const systemMessage = {
            role: "system",
            content: `You are a realistic and honest career advisor who prioritizes accurate job fit analysis.
            You must be strict about experience requirements and never overstate qualifications.
            
            Key rules:
            - Entry level roles (0-2 years) match with interns/juniors
            - Mid level roles (3-5 years) require proven work experience
            - Senior roles (5+ years) require extensive experience
            - Management roles require prior management experience
            - Technical roles require specific technical skill matches
            - Don't assume skills that aren't explicitly mentioned
            - Be direct about missing requirements
            
            Format response as:
            1. Start with clear Yes/No and main reason
            2. List 1-2 key matching requirements OR main gaps
            3. Give one specific, actionable tip
            
            Example responses:
            "No - This senior engineering manager role requires 7+ years of experience and prior team management, which you don't yet have as an intern. Focus on gaining more hands-on development experience in your current role before pursuing management positions."
            
            "Yes - As a junior developer with 2 years of React experience, you meet the core requirements for this entry-level frontend role. Your recent React projects align well with their tech stack. Consider highlighting your experience with their specific UI frameworks in your application."
            
            Keep responses direct and honest, around 300 characters.`
        };

        const userMessage = {
            role: "user",
            content: `Analyze this job fit based on requirements:
Title: ${jobPosting.title}
Company: ${jobPosting.company}
Experience Level: ${jobPosting.experiencelevel}
Location: ${jobPosting.location}
Description: ${jobPosting.description}

Remember to be realistic about experience requirements and strict about required skills.`
        };

        const client = new ModelClient(
            process.env.AZURE_INFERENCE_SDK_ENDPOINT ?? "https://junera-ai-services.services.ai.azure.com/models",
            new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY)
        );

        const response = await client.path("/chat/completions").post({
            body: {
                messages: [systemMessage, userMessage],
                max_tokens: 400,
                temperature: 0.3,
                model: process.env.AZURE_DEPLOYMENT_NAME ?? "gpt-4",
                stream: true
            }
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
        console.error('Error in POST /analyze:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}