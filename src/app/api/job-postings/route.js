// /pages/api/jobPostings.js
import { createDatabaseConnection } from "@/lib/db";
import { getCompanies } from "@/lib/companyCache";
import { performance } from 'perf_hooks';

function scanKeywords(text) {
  const keywordsList = [
    'JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'Python', 'Java', 'SQL', 'C++',
    'C#', 'Azure', 'Machine Learning', 'Artificial Intelligence', 'AWS', 'Rust',
    'TypeScript', 'Angular', 'Vue.js', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'GraphQL', 'RESTful', 'API', 'Microservices', 'Serverless', 'Firebase', 'MongoDB',
    'PostgreSQL', 'MySQL', 'NoSQL', 'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD',
    'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Jenkins', 'Git', 'GitHub',
    'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Trello', 'VSCode', 'IntelliJ',
    'WebStorm', 'PyCharm', 'Eclipse', 'NetBeans', 'Visual Studio', 'Xcode',
    'Android Studio', 'C#', 'Unity', 'Unreal Engine', 'Blender', 'Maya', 'Photoshop',
    'Google Office', 'Microsoft office', 'Adobe Creative Suite', 'Figma', 'Sketch', 'Project Management', 'Excel', 'SaaS', 
    'PaaS', 'IaaS', 'NFT', 'Blockchain', 'Cryptocurrency', 'Web3', 'Solidity', 'Rust', 'Golang', 'Ruby', 'Scala', 'Kotlin',
    'Swift', 'Objective-C', 'Flutter', 'React Native', 'Ionic', 'Xamarin', 'PhoneGap', 'Cordova', 'NativeScript', 'Electron', 'Government Consulting',
    'Semiconductors", "Aerospace', 'Defense', 'Healthcare', 'Finance', 'Banking', 'Insurance', 'Retail', 'E-commerce', 'Education', 'Transportation',
  ];

  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const lowerText = text.toLowerCase();
  return keywordsList.filter(keyword => {
    const escapedKeyword = escapeRegex(keyword.toLowerCase());
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'g');
    return regex.test(lowerText);
  });
}

export async function GET(req) {
  const url = await req.url;
  const { searchParams } = new URL(url);
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  const title = searchParams.get("title")?.trim() || "";
  const experienceLevel = searchParams.get("experienceLevel")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "";
  const company = searchParams.get("company")?.trim() || "";

  const timings = {};
  const overallStart = performance.now();

  try {
    const [companies, db] = await Promise.all([
      getCompanies(),
      createDatabaseConnection()
    ]);

    const companiesFetched = performance.now();
    timings.fetchCompaniesAndConnection = companiesFetched - overallStart;

    // Create a lookup for company names
    const companyNameMap = {};
    for (const [id, details] of Object.entries(companies)) {
      companyNameMap[details.name.toLowerCase()] = parseInt(id);
    }

    // Build query
    let query = `
      SELECT 
        jp.id, 
        jp.title, 
        jp.location, 
        jp.description,
        jp.postedDate, 
        jp.salary,
        jp.salary_range_str,
        jp.experienceLevel,
        jp.company_id
      FROM jobPostings jp WITH (NOLOCK)
      WHERE jp.deleted = 0
    `;

    const params = {};

    // If we have full-text search on title:
    if (title) {
      // Escape potential quotes and use a wildcard match for partial matches
      const sanitizedTitle = title.replace(/"/g, '""');
      query += ` AND CONTAINS(jp.title, @title)`;
      params.title = `"${sanitizedTitle}*"`;
    }

    if (experienceLevel) {
      query += ` AND jp.experienceLevel = @experienceLevel`;
      params.experienceLevel = experienceLevel;
    }

    // If we have full-text search on location:
    if (location) {
      const sanitizedLocation = location.replace(/"/g, '""');
      query += ` AND CONTAINS(jp.location, @location)`;
      params.location = `"${sanitizedLocation}*"`;
    }

    if (company) {
    // company is already an id here.
      const companyId = company;
      if (!companyId) {
        // If company not found, return empty results early
        const queryPrepEnd = performance.now();
        timings.queryPreparation = queryPrepEnd - companiesFetched;
        const overallEnd = performance.now();
        timings.total = overallEnd - overallStart;
        return new Response(JSON.stringify({ jobPostings: [], timings }), { status: 200 });
      }
      query += ` AND jp.company_id = @company_id`;
      params.company_id = companyId;
    }

    query += `
      ORDER BY 
        jp.postedDate DESC, jp.id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    params.offset = offset;
    params.limit = limit;

    const queryPrepStart = performance.now();
    const queryExecStart = performance.now();
    const result = await db.executeQuery(query, params);
    const queryExecEnd = performance.now();
    timings.queryExecution = queryExecEnd - queryExecStart;
    const queryPrepEnd = performance.now();
    timings.queryPreparation = queryPrepEnd - queryPrepStart;

    // Process results
    const jobPostings = result.recordset.map((job) => {
      const companyInfo = companies[job.company_id] || { name: "Unknown", logo: null };
      const keywords = scanKeywords(job.description);
      const remoteKeyword = job.location.toLowerCase().includes('remote') ? 'Remote' : null;
      

      return {
        id: job.id,
        title: job.title,
        company: companyInfo.name,
        experienceLevel: job.experienceLevel,
        description: job.description,
        location: job.location,
        salary: job.salary,
        logo: companyInfo.logo,
        postedDate: job.postedDate,
        remoteKeyword,
        keywords
      };
    });

    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;

    return new Response(JSON.stringify({ jobPostings, timings }), { status: 200 });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    const overallEnd = performance.now();
    timings.total = overallEnd - overallStart;
    return new Response(JSON.stringify({ error: "Error fetching job postings", timings }), { status: 500 });
  }
}
