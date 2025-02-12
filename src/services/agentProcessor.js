const { query, longQuery } = require('../lib/pgdb');
const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");

async function processJob(userId, jobId, userProfile, jobDetails) {
  try {
    // Check if already processed
    const existing = await query(
      'SELECT id FROM agent_progress WHERE user_id = $1 AND job_id = $2',
      [userId, jobId]
    );
    
    if (existing.rows.length > 0) {
      return null;
    }

    const systemMessage = {
      role: "system",
      content: `You are a recruitment assistant that analyzes job postings and user profiles to determine if there's a good match. 
      Review the following profile and job posting carefully. Focus on:
      1. Skills match (required vs user's skills)
      2. Experience level alignment 
      3. Location compatibility (including remote work)
      4. Role/title match with user preferences

      Provide your response as a JSON object with the following format exactly:
      {
        "isMatch": boolean,
        "reason": "detailed explanation of why this is or isn't a good match",
        "confidenceScore": number between 0 and 1,
        "skillsMatch": number between 0 and 1,
        "experienceLevelMatch": number between 0 and 1,
        "locationMatch": number between 0 and 1
      }`
    };

    const userMessage = {
      role: "user", 
      content: `User Profile: ${JSON.stringify(userProfile)}
      Job Details: ${JSON.stringify(jobDetails)}`
    };

    const client = new ModelClient(
      process.env.AZURE_INFERENCE_SDK_ENDPOINT ?? "https://junera-ai-services.services.ai.azure.com/models",
      new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY)
    );

    const response = await client.path("chat/completions").post({
      body: {
        messages: [systemMessage, userMessage],
        max_tokens: 800,
        temperature: 0.2,
        model: process.env.AZURE_DEPLOYMENT_NAME ?? "gpt-4o-mini",
      },
    });

    const completion = await response.body.json();
    const result = JSON.parse(completion.choices[0].message.content);

    // Store the result
    await query(
      `INSERT INTO agent_progress 
       (user_id, job_id, is_match, match_reason, confidence_score, processed_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, jobId, result.isMatch, result.reason, result.confidenceScore]
    );

    return result;
  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
}

async function processAllPendingJobs() {
  try {
    // Get users with their preferences that haven't been processed in the last 24 hours
    const users = await longQuery(`
      SELECT 
        u.id,
        json_build_object(
            'username', u.username,
            'full_name', u.full_name,
            'headline', u.headline,
            'job_prefs_title', u.job_prefs_title,
            'job_prefs_location', u.job_prefs_location,
            'job_prefs_skills', u.job_prefs_skills,
            'job_prefs_level', u.job_prefs_level,
            'job_prefs_relocatable', u.job_prefs_relocatable
        ) as profile
      FROM users u
      WHERE (u.is_premium = true 
             OR u.job_prefs_title IS NOT NULL 
             OR u.job_prefs_level IS NOT NULL)
      AND NOT EXISTS (
        SELECT 1 FROM agent_progress ap 
        WHERE ap.user_id = u.id 
        AND ap.processed_at > NOW() - INTERVAL '24 hours'
      )
      LIMIT 100
    `);

    // Get recent jobs that haven't been processed
    const jobs = await longQuery(`
      SELECT j.* 
      FROM jobPostings j
      WHERE j.created_at > NOW() - INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM agent_progress ap 
        WHERE ap.job_id = j.id
      )
      ORDER BY j.created_at DESC
      LIMIT 1000
    `);

    console.log(`Processing ${users.rows.length} users and ${jobs.rows.length} jobs`);

    // Process jobs for each user
    for (const user of users.rows) {
      for (const job of jobs.rows) {
        await processJob(user.id, job.id, user.profile, job);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in job processing batch:', error);
    throw error;
  }
}

module.exports = {
  processJob,
  processAllPendingJobs
};