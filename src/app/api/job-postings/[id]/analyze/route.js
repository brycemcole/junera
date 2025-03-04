import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import aiAgent from '@/services/aiAgent';

async function getCompleteUserProfile(userId) {
    const queryText = `
      WITH UserInfo AS (
          SELECT 
              username, full_name, headline, email, phone_number, profile_links,
              is_premium, job_prefs_title, job_prefs_location, job_prefs_skills,
              job_prefs_industry, job_prefs_language, job_prefs_salary, job_prefs_relocatable,
              job_prefs_level, avatar, github_user, github_access_token
          FROM users
          WHERE id = $1
      ),
      Education AS (
          SELECT 
              id, institution_name, degree, field_of_study, start_date,
              end_date, is_current, description
          FROM user_education
          WHERE user_id = $1
      ),
      Certifications AS (
          SELECT 
              id, certification_name, issuing_organization, issue_date, 
              expiration_date, credential_id, credential_url
          FROM user_certifications
          WHERE user_id = $1
      ),
      WorkExperience AS (
          SELECT 
              id, company_name, job_title, start_date, end_date, 
              location, is_current, description
          FROM user_job_experience
          WHERE user_id = $1
      ),
      Projects AS (
          SELECT 
              id, project_name, start_date, end_date, is_current, 
              description, technologies_used, project_url, github_url,
              producthunt_url
          FROM user_projects
          WHERE user_id = $1
      ),
      Awards AS (
          SELECT 
              id, award_name, award_issuer, award_date, award_url, 
              award_id, award_description
          FROM user_awards
          WHERE user_id = $1
      ),
      Skills AS (
          SELECT 
              entity_type,
              entity_id,
              json_agg(
                  json_build_object(
                      'skill_name', skill_name,
                      'created_at', created_at
                  )
              ) as skills
          FROM entity_skills
          WHERE user_id = $1
          GROUP BY entity_type, entity_id
      )
      SELECT 
          (SELECT row_to_json(UserInfo) FROM UserInfo) as userdata,
          (SELECT json_agg(Education) FROM Education) as educationdata,
          (SELECT json_agg(Certifications) FROM Certifications) as certificationdata,
          (SELECT json_agg(WorkExperience) FROM WorkExperience) as experiencedata,
          (SELECT json_agg(Projects) FROM Projects) as projectdata,
          (SELECT json_agg(Awards) FROM Awards) as awarddata,
          (SELECT json_object_agg(
              COALESCE(entity_type || '_' || COALESCE(entity_id::text, 'null'), entity_type),
              skills
          ) FROM Skills) as skills;
    `;
  
    const result = await query(queryText, [userId]);
    if (result.rows.length === 0) {
      throw new Error('Profile not found');
    }
  
    const { userdata, educationdata, certificationdata, experiencedata, projectdata, awarddata, skills } = result.rows[0];
    return {
      user: userdata || {},
      education: educationdata || [],
      certifications: certificationdata || [],
      experience: experiencedata || [],
      projects: projectdata || [],
      awards: awarddata || [],
      skills: skills || {}
    };
  }
  

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

        const { id } = await params;
        
        console.log(`Checking analysis for job_id: ${id}, user_id: ${decoded.id}`);

        // First try to get the response
        const result = await query(
            'SELECT response, worthy_apply, explanation, created_at FROM job_posting_agent_responses WHERE job_posting_id = $1 AND user_id = $2',
            [id, decoded.id]
        );

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

        // Get the user's complete profile data using the helper function
        const userProfile = await getCompleteUserProfile(decoded.id);

        // get the job posting 
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

        // Get the streaming response from AIAgent with profile data
        const stream = await aiAgent.analyzeJobFit(jobPosting, userProfile);

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