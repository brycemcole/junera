
const he = require('he');

export function scanKeywords(text) {
  // ...existing scanKeywords function code...
}

export function extractSalary(text) {
  // ...existing extractSalary function code...
}

export function processJobPostings(jobs) {
  return jobs.map((job) => {
    const keywords = scanKeywords(job.description);
    const remoteKeyword = job.location?.toLowerCase().includes('remote') ? 'Remote' : "";
    const salary = extractSalary(job.description);

    return {
      id: job.job_id,
      title: job.title || "",
      company: job.company || "",
      companyLogo: `https://logo.clearbit.com/${encodeURIComponent(job.company?.replace('.com', ''))}.com`,
      experienceLevel: job.experiencelevel || "",
      description: job.description || "",
      location: job.location || "",
      salary: salary,
      postedDate: job.created_at ? job.created_at.toISOString() : "",
      remoteKeyword: remoteKeyword,
      keywords: keywords,
    };
  });
}