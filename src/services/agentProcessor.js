const { query, longQuery } = require('../lib/pgdb');
const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const AIAgent = require('./aiAgent');

// Function to get complete user profile
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

async function processJob(taskId, jobId, userProfile, jobDetails) {
  try {
    console.log(`Starting job analysis for job ${jobId}`);
    
    // Check if this job has already been processed for this task
    const existingNote = await query(
      `SELECT id FROM agent_notes WHERE agent_task_id = $1 AND job_id = $2`,
      [taskId, jobId]
    );
    
    // If note already exists, don't process again
    if (existingNote.rows.length > 0) {
      console.log(`Job ${jobId} already processed for task ${taskId}, skipping.`);
      
      // Make sure the job is marked as processed in the task
      await query(
        `UPDATE agent_tasks 
         SET processed_job_ids = array_append(array_remove(processed_job_ids, $1), $1)
         WHERE id = $2 AND NOT $1 = ANY(processed_job_ids)`,
        [jobId, taskId]
      );
      
      return null;
    }
    
    // Get job fit analysis using the AIAgent method
    const analysis = await AIAgent.getJobFit(userProfile, jobDetails);
    
    console.log('Complete job analysis:', {
      jobId,
      userProfile,
      taskId,
      analysis
    });

    if (!analysis.trim()) {
      console.warn(`Warning: Empty analysis content for job ${jobId}`);
      return;
    }

    // Insert the agent response into agent_notes table
    const parsedAnalysis = JSON.parse(analysis);
    await query(
      `INSERT INTO agent_notes (agent_task_id, job_id, match_score, explanation) 
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [taskId, jobId, parsedAnalysis.matchScore, parsedAnalysis.message]
    );

    // Update the agent_tasks with just the processed job id
    await query(
      `UPDATE agent_tasks 
       SET processed_job_ids = array_append(processed_job_ids, $1),
           jobs_processed_count = COALESCE(jobs_processed_count, 0) + 1,
           last_processed_at = NOW()
       WHERE id = $2`,
      [jobId, taskId]
    );

    return analysis;
  } catch (error) {
    console.error('Error processing job:', error);
    // Don't rethrow the error - this allows the process to continue with other jobs
    return null;
  }
}

// Process a single task by ID
async function processTask(taskId) {
  try {
    console.log(`Processing single task: ${taskId}`);

    // Get task details
    const taskResult = await query(`
      SELECT * FROM agent_tasks WHERE id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const task = taskResult.rows[0];
    
    // Update task status to processing
    await query(`
      UPDATE agent_tasks 
      SET status = 'processing', 
          processing_started_at = NOW(),
          jobs_processed_count = 0
      WHERE id = $1
    `, [taskId]);

    // Get complete user profile if not already available
    let completeProfile = task.user_profile;
    if (!completeProfile) {
      completeProfile = await getCompleteUserProfile(task.user_id);
      await query(
        `UPDATE agent_tasks SET user_profile = $1 WHERE id = $2`,
        [JSON.stringify(completeProfile), task.id]
      );
    } else if (typeof completeProfile === 'string') {
      completeProfile = JSON.parse(completeProfile);
    }

    // Setup search parameters
    const searchTitle = task.search_title || (completeProfile.user.job_prefs_title?.length > 0 ? completeProfile.user.job_prefs_title[0] : '');
    const searchLocation = task.search_location || (completeProfile.user.job_prefs_location?.length > 0 ? completeProfile.user.job_prefs_location[0] : '');
    const searchExperienceLevel = task.search_experience_level || (completeProfile.user.job_prefs_level?.length > 0 ? completeProfile.user.job_prefs_level[0] : '');

    const titleParam = searchTitle ? `%${searchTitle}%` : '%';
    const searchTitlePattern = searchTitle ? `%(${searchTitle.split(' ').join('|')})%` : '%';
    const locationParam = searchLocation ? `%${searchLocation}%` : '%';

    // Only keep the last 100 processed job IDs
    const processedIds = (task.processed_job_ids || []).slice(-100);
    
    console.log('Executing job query with params:', {
      title: titleParam,
      titlePattern: searchTitlePattern,
      location: locationParam,
      relocatable: completeProfile.user.job_prefs_relocatable,
      experienceLevel: searchExperienceLevel,
      processedJobIds: processedIds,
      processedIdsCount: processedIds.length
    });

    // Setup query parameters
    let offset = 0;
    const limit = 25; // Process fewer jobs for immediate feedback
    let totalProcessedJobs = 0;
    const maxJobsToProcess = 50; // Process fewer jobs for immediate feedback

    // Get the date 120 days ago
    const oldestJobDate = new Date();
    oldestJobDate.setDate(oldestJobDate.getDate() - 120);

    while (totalProcessedJobs < maxJobsToProcess) {
      // Update progress in the database
      await query(`
        UPDATE agent_tasks
        SET jobs_processed_count = $1,
            progress = $2
        WHERE id = $3
      `, [totalProcessedJobs, Math.min(100, Math.round((totalProcessedJobs / maxJobsToProcess) * 100)), taskId]);

      // Build query using same pattern as job-actions.js
      let queryText = `
        WITH RankedJobs AS (
          SELECT 
            job_id,
            title,
            company,
            location,
            description,
            salary,
            experiencelevel,
            created_at,
            source_url,
            ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) as rn
          FROM jobPostings
          WHERE created_at >= $1
      `;
      
      const paramsArray = [oldestJobDate];
      
      // Add title search conditions
      if (searchTitle) {
        paramsArray.push(`%${searchTitle}%`);
        paramsArray.push(searchTitlePattern);
        queryText += ` AND (LOWER(title) LIKE LOWER($${paramsArray.length-1}) 
                      OR LOWER(title) SIMILAR TO LOWER($${paramsArray.length}))`;
      }
      
      // Add location search conditions
      if (searchLocation) {
        paramsArray.push(`%${searchLocation}%`);
        queryText += ` AND (LOWER(location) LIKE LOWER($${paramsArray.length})`;
        
        if (completeProfile.user.job_prefs_relocatable) {
          queryText += ` OR LOWER(location) ILIKE '%remote%'`;
        }
        
        queryText += `)`;
      } else if (completeProfile.user.job_prefs_relocatable) {
        queryText += ` AND LOWER(location) ILIKE '%remote%'`;
      }
      
      // Add experience level conditions
      if (searchExperienceLevel) {
        paramsArray.push(searchExperienceLevel);
        queryText += ` AND LOWER(experiencelevel) = LOWER($${paramsArray.length})`;
      }
      
      // Add condition for processed job ids
      if (processedIds.length > 0) {
        queryText += ` AND job_id NOT IN (${processedIds.map((_, idx) => 
          `$${paramsArray.length + idx + 1}`).join(',')})`;
        paramsArray.push(...processedIds);
      }
      
      // Close the CTE and add the final query
      queryText += `) 
        SELECT 
          job_id,
          title,
          company,
          location,
          description,
          salary,
          experiencelevel,
          created_at,
          source_url
        FROM RankedJobs 
        WHERE rn = 1 
        ORDER BY created_at DESC 
        LIMIT $${paramsArray.length + 1} OFFSET $${paramsArray.length + 2}`;
      
      paramsArray.push(limit, offset);

      // Log the actual query and parameters for debugging
      console.log('Query:', queryText);
      console.log('Params:', paramsArray);

      const jobs = await query(queryText, paramsArray);

      console.log(`Found ${jobs.rows.length} matching jobs in this batch (offset: ${offset})`);

      if (jobs.rows.length === 0) {
        console.log('No more jobs found, exiting loop.');
        break;
      }

      for (const job of jobs.rows) {
        try {
          console.log(`Processing job ${job.job_id} for task ${task.id}`);
          await processJob(task.id, job.job_id, completeProfile, job);
          totalProcessedJobs++;

          // Update the processed job count in real-time
          await query(`
            UPDATE agent_tasks
            SET jobs_processed_count = $1,
                progress = $2
            WHERE id = $3
          `, [totalProcessedJobs, Math.min(100, Math.round((totalProcessedJobs / maxJobsToProcess) * 100)), taskId]);

          if (totalProcessedJobs >= maxJobsToProcess) {
            console.log(`Reached maximum jobs to process (${maxJobsToProcess}), exiting loop.`);
            break;
          }
        } catch (jobError) {
          // Log error but continue with next job
          console.error(`Failed to process job ${job.job_id} for task ${task.id}:`, jobError);
        }
      }

      offset += limit;
    }

    console.log(`Total jobs processed for task ${task.id}: ${totalProcessedJobs}`);
    
    // Mark task as completed
    await query(`
      UPDATE agent_tasks 
      SET status = 'completed', 
          processing_completed_at = NOW(),
          jobs_processed_count = $1,
          progress = 100
      WHERE id = $2
    `, [totalProcessedJobs, taskId]);
    
    return true;
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    
    // Mark task as error
    await query(`
      UPDATE agent_tasks 
      SET status = 'error',
          error_message = $1
      WHERE id = $2
    `, [error.message, taskId]);
    
    throw error;
  }
}

async function processAllPendingTasks() {
  try {
    console.log('Processing agent tasks...');

    const batchSize = 5;
    const tasks = await query(`
      WITH tasks_to_process AS (
        SELECT id, user_id
        FROM agent_tasks at
        WHERE status = 'pending' OR status IS NULL
        ORDER BY id
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      SELECT 
        at.*
      FROM tasks_to_process tp
      INNER JOIN agent_tasks at ON at.id = tp.id
    `, [batchSize]);
    
    console.log('Found tasks:', tasks.rows.length, 'First task:', tasks.rows[0]?.id);

    console.log(`Processing ${tasks.rows.length} tasks...`);

    // Process tasks concurrently but with controlled parallelism
    await Promise.all(tasks.rows.map(async (task) => {
      try {
        await processTask(task.id);
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
      }
    }));

    return true;
  } catch (error) {
    console.error('Error in task processing batch:', error);
    throw error;
  }
}

async function explainFurther(noteId) {
  try {
    // First check if we already have a detailed explanation
    const existingNote = await query(
      `SELECT match_score, explanation, detailed_explanation FROM agent_notes WHERE id = $1`,
      [noteId]
    );

    if (existingNote.rows[0]?.detailed_explanation) {
      // Return existing explanation as a stream to maintain consistent response format
      return new ReadableStream({
        async start(controller) {
          try {
            // Send the existing explanation in chunks to simulate streaming
            const content = existingNote.rows[0].detailed_explanation;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }

    // If no existing explanation, get the note and associated data
    const noteQuery = `
      SELECT 
        an.*,
        at.user_id,
        jp.*
      FROM agent_notes an
      JOIN agent_tasks at ON an.agent_task_id = at.id
      JOIN jobpostings jp ON an.job_id = jp.job_id
      WHERE an.id = $1
    `;
    
    const noteResult = await query(noteQuery, [noteId]);
    if (noteResult.rows.length === 0) {
      throw new Error('Note not found');
    }

    const note = noteResult.rows[0];
    
    // Get the complete user profile with projects, skills, etc.
    const userProfile = await getCompleteUserProfile(note.user_id);
    
    // Process the skills to ensure they're properly formatted
    if (userProfile.skills && userProfile.skills.profile_null) {
      // Transform skills from [Object] format to actual skill names
      userProfile.skills = Object.entries(userProfile.skills).reduce((acc, [key, skillsArray]) => {
        if (Array.isArray(skillsArray)) {
          acc[key] = skillsArray.map(skill => {
            if (skill && skill.skill_name) {
              return skill.skill_name;
            } else if (typeof skill === 'object') {
              return JSON.stringify(skill);
            }
            return skill;
          });
        } else {
          acc[key] = skillsArray;
        }
        return acc;
      }, {});
    }
    
    console.log('User profile:', userProfile);
    
    const jobPosting = {
      job_id: note.job_id,
      title: note.title,
      company: note.company,
      location: note.location,
      description: note.description,
      experiencelevel: note.experiencelevel,
    };

    const systemMessage = {
      role: "system",
      content: `You are a career advisor providing an in-depth analysis of a job match directly to the job seeker.
      Speak directly to the user in first person, as if you're having a conversation with them.
      
      Give a thorough breakdown of why this role matches or doesn't match their profile.
      
      Consider and explicitly address:
      1. Experience alignment - years and relevance
      2. Technical skills match - required vs actual
      3. Project relevance - how their projects demonstrate capabilities
      4. Career trajectory - how this role fits their path
      5. Specific recommendations - what they can do to become a stronger candidate
      
      Format your response in clear sections:
      • Overall Match Assessment
      • Your Key Strengths
      • Areas for Your Growth
      • Strategic Recommendations for You
      
      Be conversational, supportive and personal. Use "you" and "your" instead of referring to them in third person.
      Be constructive but honest about gaps. Give actionable advice directly to them.`
    };

    const userMessage = {
      role: "user",
      content: `Previous analysis: "${note.explanation}"

Provide a detailed explanation of this job match analysis directly to the user:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Job Details:
${JSON.stringify(jobPosting, null, 2)}

Explain to them personally why this match was rated as it was. Highlight their specific strengths and areas where they could improve to better fit this role.`
    };

    const result = await AIAgent.client.chat.completions.create({
      messages: [systemMessage, userMessage],
      max_tokens: 4000,
      temperature: 0.4,
      model: process.env.AZURE_DEPLOYMENT_NAME ?? "gpt-4",
      stream: true
    });

    // Return the ReadableStream for streaming responses
    return new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          for await (const chunk of result) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          
          // Store the complete response
          await query(
            `UPDATE agent_notes 
             SET detailed_explanation = $1
             WHERE id = $2`,
            [fullResponse, noteId]
          );

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

  } catch (error) {
    console.error('Error in explainFurther:', error);
    throw error;
  }
}

module.exports = {
  processJob,
  processAllPendingTasks,
  processTask,
  explainFurther
};