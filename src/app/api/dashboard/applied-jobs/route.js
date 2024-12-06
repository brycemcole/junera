import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createDatabaseConnection } from '@/lib/db';
import { getCompanies } from '@/lib/companyCache';
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 });

export async function GET(request) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cachedUserJobs = cache.get(`userJobs:${token}`);
  if (cachedUserJobs) {
    return NextResponse.json({ userJobs: cachedUserJobs }, { status: 200 });
  }
  
  try {
    console.log('JWT_SECRET:', process.env.SESSION_SECRET); // Debugging line
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
    const userId = decoded.id; // Adjust based on token payload structure
    console.log('Decoded userId:', decoded); // Debugging line

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    // Connect to the database
    const [pool, companies ] = await Promise.all([createDatabaseConnection(), getCompanies()]);

    // Query for user jobs from dbo.user_jobs
    const query = `        
          SELECT 
          aj.id AS appliedJobId,
          aj.applied_at AS appliedAt,
          jp.id AS jobId,
          jp.title as jobTitle, 
          jp.location, 
          jp.postedDate, 
          jp.experienceLevel,
          jp.salary
        FROM user_jobs aj
        INNER JOIN jobPostings jp ON aj.job_id = jp.id
        WHERE aj.user_id = @userId
        ORDER BY aj.applied_at DESC;`;
    const userJobsResult = await pool.executeQuery(query, { userId });

    const formattedUserJobs = userJobsResult.recordset.map(job => ({
      id: job.jobId,
      userId: job.userId,
      favId: job.id,
      postedDate: job.appliedAt,
      status: job.status,
      location: job.location,
      salary: job.salary,
      experienceLevel: job.experienceLevel,
      jobStatus: job.jobStatus,
      title: job.jobTitle,
      company: job.companyName,
      isCoreJob: job.isCoreJob,
    }));

    cache.set(`userJobs:${token}`, formattedUserJobs);

    return NextResponse.json({ userJobs: formattedUserJobs }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
