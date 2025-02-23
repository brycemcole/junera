import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import aiAgent from '@/services/aiAgent';

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
            'SELECT response, worthy_apply, explanation, created_at FROM job_posting_agent_responses WHERE job_posting_id = $1 AND user_id = $2',
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
            worthy_apply: result.rows[0].worthy_apply,
            explanation: result.rows[0].explanation?.length,
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

        const { id } = await params;
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

        // Get the streaming response from AIAgent
        const stream = await aiAgent.analyzeJobFit(jobPosting);

        // After successful analysis, store the complete response
        let fullResponse = '';
        const reader = stream.getReader();
        const newStream = new ReadableStream({
            async start(controller) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        // Forward the chunk to the client
                        controller.enqueue(value);

                        // Accumulate the response
                        const text = new TextDecoder().decode(value);
                        const lines = text.split('\n').filter(line => line.trim() !== '');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const jsonStr = line.replace('data: ', '').trim();
                                if (jsonStr === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(jsonStr);
                                    if (parsed.content) {
                                        fullResponse += parsed.content;
                                    }
                                } catch (err) {
                                    console.error('Error parsing chunk:', err);
                                }
                            }
                        }
                    }
                    
                    // Store the complete response in the database
                    try {
                        // Try to parse the complete response to get worthy_apply and explanation
                        const parsedResponse = JSON.parse(fullResponse);
                        await query(
                            `INSERT INTO job_posting_agent_responses 
                            (job_posting_id, user_id, response, worthy_apply, explanation)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (job_posting_id, user_id) 
                            DO UPDATE SET 
                                response = $3,
                                worthy_apply = $4,
                                explanation = $5,
                                updated_at = NOW()`,
                            [id, decoded.id, fullResponse, parsedResponse.worthy_apply, parsedResponse.explanation]
                        );
                    } catch (dbError) {
                        console.error('Error saving response to database:', dbError);
                        // If parsing fails, still save the raw response
                        await query(
                            `INSERT INTO job_posting_agent_responses 
                            (job_posting_id, user_id, response)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (job_posting_id, user_id) 
                            DO UPDATE SET response = $3, updated_at = NOW()`,
                            [id, decoded.id, fullResponse]
                        );
                    }

                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(newStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
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