const he = require('he');

export function scanKeywords(text) {
  if (!text) return [];
  const keywordsList = [
    'JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'Python', 'Java', 'SQL', 'C++',
    'C#', 'Azure', 'Machine Learning', 'Artificial Intelligence', 'AWS', 'Rust',
    'TypeScript', 'Angular', 'Vue.js', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'GraphQL', 'RESTful', 'API', 'Microservices', 'Serverless', 'Firebase', 'MongoDB',
    'PostgreSQL', 'MySQL', 'NoSQL', 'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD',
    'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Jenkins', 'Git', 'GitHub',
    'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Trello', 'VSCode', 'IntelliJ',
    'WebStorm', 'PyCharm', 'Eclipse', 'NetBeans', 'Visual Studio', 'Xcode',
    'Android Studio', 'Unity', 'Unreal Engine', 'Blender', 'Maya', 'Photoshop',
    'Google Office', 'Microsoft office', 'Adobe Creative Suite', 'Figma', 'Sketch',
    'Project Management', 'Excel', 'SaaS', 'PaaS', 'IaaS', 'NFT', 'Blockchain',
    'Cryptocurrency', 'Web3', 'Solidity', 'Rust', 'Golang', 'Ruby', 'Scala', 'Kotlin',
    'Swift', 'Objective-C', 'Flutter', 'React Native', 'Ionic', 'Xamarin', 'PhoneGap',
    'Cordova', 'NativeScript', 'Electron', 'Government Consulting', 'Semiconductors',
    'Aerospace', 'Defense', 'Healthcare', 'Finance', 'Banking', 'Insurance', 'Retail',
    'E-commerce', 'Education', 'Transportation'
  ];

  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const lowerText = text.toLowerCase();
  return keywordsList.filter(keyword => {
    const escapedKeyword = escapeRegex(keyword.toLowerCase());
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'g');
    return regex.test(lowerText);
  });
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