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
    )
    SELECT 
        (SELECT row_to_json(UserInfo) FROM UserInfo) as userdata,
        (SELECT json_agg(Education) FROM Education) as educationdata,
        (SELECT json_agg(Certifications) FROM Certifications) as certificationdata,
        (SELECT json_agg(WorkExperience) FROM WorkExperience) as experiencedata,
        (SELECT json_agg(Projects) FROM Projects) as projectdata,
        (SELECT json_agg(Awards) FROM Awards) as awarddata;
  `;

  const result = await query(queryText, [userId]);
  if (result.rows.length === 0) {
    throw new Error('Profile not found');
  }

  const { userdata, educationdata, certificationdata, experiencedata, projectdata, awarddata } = result.rows[0];
  return {
    user: userdata || {},
    education: educationdata || [],
    certifications: certificationdata || [],
    experience: experiencedata || [],
    projects: projectdata || [],
    awards: awarddata || []
  };
}

async function processJob(taskId, jobId, userProfile, jobDetails) {
  try {
    console.log(`Starting job analysis for job ${jobId}`);
    
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
       SET processed_job_ids = array_append(processed_job_ids, $1)
       WHERE id = $2`,
      [jobId, taskId]
    );

    return analysis;
  } catch (error) {
    console.error('Error processing job:', error);
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
        // Get complete user profile
        const completeProfile = await getCompleteUserProfile(task.user_id);
        
        // Update the task with complete profile if not already set
        if (!task.user_profile) {
          await query(
            `UPDATE agent_tasks SET user_profile = $1 WHERE id = $2`,
            [JSON.stringify(completeProfile), task.id]
          );
          task.user_profile = completeProfile;
        }

        const searchTitle = task.search_title || (completeProfile.user.job_prefs_title?.length > 0 ? completeProfile.user.job_prefs_title[0] : '');
        const searchLocation = task.search_location || (completeProfile.user.job_prefs_location?.length > 0 ? completeProfile.user.job_prefs_location[0] : '');
        const searchExperienceLevel = task.search_experience_level || (completeProfile.user.job_prefs_level?.length > 0 ? completeProfile.user.job_prefs_level[0] : '');

        const titleParam = searchTitle ? `%${searchTitle}%` : '%';
        const searchTitlePattern = searchTitle ? `%(${searchTitle.split(' ').join('|')})%` : '%';
        const locationParam = searchLocation ? `%${searchLocation}%` : '%';

        console.log('Executing job query with params:', {
          title: titleParam,
          titlePattern: searchTitlePattern,
          location: locationParam,
          relocatable: completeProfile.user.job_prefs_relocatable,
          experienceLevel: searchExperienceLevel,
          processedJobIds: task.processed_job_ids || []
        });

        let offset = 0;
        const limit = 50;
        let totalProcessedJobs = 0;
        const maxJobsToProcess = 1000;

        while (totalProcessedJobs < maxJobsToProcess) {
          const jobQuery = `
            SELECT * FROM jobPostings 
            WHERE 
              (LOWER(title) LIKE LOWER($1) 
               OR LOWER(title) SIMILAR TO LOWER($2))
              AND (LOWER(location) LIKE LOWER($3)
                   OR ($4 = true AND LOWER(location) ILIKE '%remote%'))
              AND ($5 = '' OR LOWER(experiencelevel) = LOWER($5))
              AND (array_length($6::text[], 1) IS NULL OR job_id <> ALL($6::text[]))
            ORDER BY created_at DESC
            LIMIT $7 OFFSET $8`;

          const jobs = await query(
            jobQuery,
            [
              titleParam,
              searchTitlePattern,
              locationParam,
              completeProfile.user.job_prefs_relocatable,
              searchExperienceLevel,
              task.processed_job_ids || [],
              limit,
              offset
            ]
          );

          console.log(`Found ${jobs.rows.length} matching jobs in this batch (offset: ${offset})`);

          if (jobs.rows.length === 0) {
            console.log('No more jobs found, exiting loop.');
            break;
          }

          for (const job of jobs.rows) {
            console.log(`Processing job ${job.job_id} for task ${task.id}`);
            await processJob(task.id, job.job_id, completeProfile, job);
            totalProcessedJobs++;

            if (totalProcessedJobs >= maxJobsToProcess) {
              console.log(`Reached maximum jobs to process (${maxJobsToProcess}), exiting loop.`);
              break;
            }
          }

          offset += limit;
        }
        console.log(`Total jobs processed for task ${task.id}: ${totalProcessedJobs}`);
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
      return {
        original: existingNote.rows[0].explanation,
        detailed: existingNote.rows[0].detailed_explanation
      };
    }

    // If no existing explanation, get the note and associated data
    const noteQuery = `
      SELECT 
        an.*,
        at.user_profile,
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
    const userProfile = note.user_profile;
    const jobPosting = {
      job_id: note.job_id,
      title: note.title,
      company: note.company,
      location: note.location,
      description: note.description,
      experiencelevel: note.experiencelevel,
      // ...other job fields
    };

    const systemMessage = {
      role: "system",
      content: `You are a career advisor providing an in-depth analysis of a job match.
      Give a thorough breakdown of why this role matches or doesn't match their profile.
      
      Consider and explicitly address:
      1. Experience alignment - years and relevance
      2. Technical skills match - required vs actual
      3. Project relevance - how their projects demonstrate capabilities
      4. Career trajectory - how this role fits their path
      5. Specific recommendations - what they can do to become a stronger candidate
      
      Format your response in clear sections:
      • Overall Match Assessment
      • Key Strengths
      • Areas for Growth
      • Strategic Recommendations
      
      Be constructive but honest about gaps. Give actionable advice.`
    };

    const userMessage = {
      role: "user",
      content: `Previous analysis: "${note.explanation}"

Provide a detailed explanation of this job match analysis considering:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Job Details:
${JSON.stringify(jobPosting, null, 2)}

Explain why this match was rated as it was and provide specific details about strengths and improvement areas.`
    };

    const analysis = await AIAgent.client.path("/chat/completions").post({
      body: {
        messages: [systemMessage, userMessage],
        max_tokens: 1000,
        temperature: 0.4,
        model: process.env.AZURE_DEPLOYMENT_NAME ?? "gpt-4",
        stream: false
      }
    });

    if (!analysis.body?.choices?.[0]?.message?.content) {
      throw new Error('No valid response content found');
    }

    const detailedExplanation = analysis.body.choices[0].message.content;

    // Update the note with the detailed explanation
    await query(
      `UPDATE agent_notes 
       SET detailed_explanation = $1
       WHERE id = $2
       RETURNING *`,
      [detailedExplanation, noteId]
    );

    return {
      original: note.explanation,
      detailed: detailedExplanation
    };
  } catch (error) {
    console.error('Error in explainFurther:', error);
    throw error;
  }
}

module.exports = {
  processJob,
  processAllPendingTasks,
  explainFurther
};