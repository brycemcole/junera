const he = require('he');
export const stateMap = {
  'remote': 'N/A',
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
};

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

export const stripHTML = (str) => {
  const allowedTags = ['p', 'ul', 'li', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 'b', 'i', 'strong', 'em'];
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, 'text/html');

  // Remove disallowed tags
  const elements = doc.body.querySelectorAll('*');
  elements.forEach((el) => {
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(document.createTextNode(el.textContent));
    }
  });

  // Cap font sizes
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    const fontSize = parseFloat(computedStyle.getPropertyValue('font-size'));
    if (fontSize > 24) { // Cap font size to 24px
      el.style.fontSize = '24px';
    }
  });

  return doc.body.innerHTML;
};

export const fullStripHTML = (str) => {
  const allowedTags = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, 'text/html');

  // Remove disallowed tags
  const elements = doc.body.querySelectorAll('*');
  elements.forEach((el) => {
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(document.createTextNode(el.textContent));
    }
  });

  // Cap font sizes
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    const fontSize = parseFloat(computedStyle.getPropertyValue('font-size'));
    if (fontSize > 24) { // Cap font size to 24px
      el.style.fontSize = '24px';
    }
  });

  return doc.body.innerHTML;
};

export const normalizeLocation = (location) => {
  if (!location) return "";
  return location.toLowerCase().trim();
}


// Much more robust and readable location parsing
export const parseUSLocations = (location) => {
  if (!location) return '';


  const normalizedLocation = normalizeLocation(location);

  if (normalizedLocation.includes('remote')) {
    return 'Remote';
  }

  const stateAbbreviations = new Set();

  // Split by common delimiters, handle multiple locations
  const locationParts = normalizedLocation.split(/[,;|\/&]+/);

  for (const part of locationParts) {
    const trimmedPart = part.trim();

    // Check for direct state abbreviations (e.g., "CA")
    if (Object.values(stateMap).includes(trimmedPart.toUpperCase())) {
      stateAbbreviations.add(trimmedPart.toUpperCase());
      continue;
    }

    //check for "ST -" format
    const stateMatch = trimmedPart.match(/^([a-z]{2})\s*-/);
    if (stateMatch && Object.values(stateMap).includes(stateMatch[1].toUpperCase())) {
      stateAbbreviations.add(stateMatch[1].toUpperCase());
      continue;
    }

    // Check for full state names
    for (const stateName in stateMap) {
      if (trimmedPart.includes(stateName)) {
        stateAbbreviations.add(stateMap[stateName]);
        break; // Important: Stop after finding the first match within the part
      }
    }
  }

  // Format output
  if (stateAbbreviations.size === 0) {
    return location; // Return original if no states found
  } else if (stateAbbreviations.size === 1) {
    return Array.from(stateAbbreviations)[0]; // Return single abbreviation
  } else {
    return `${Array.from(stateAbbreviations).join(', ')}`;
  }
}

export function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Define regex patterns in order of priority
  const patterns = [
    // New pattern to match decimal hourly ranges without a suffix (e.g. "$30.94 - $47.77")
    /\$\s*(\d+(?:\.\d+)?)\s*[-–—]\s*\$\s*(\d+(?:\.\d+)?)/gi,
    // 1. Hourly rates (highest priority)
    /\$\s*(\d+\.?\d*)\s*(per\s*hour|hourly|per\s*hr|hr|h|\/ hour|\/hour|\/hr)\b/gi,

    // 2. Hourly ranges
    /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)/gi,

    // 3. Salary ranges with dashes
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 4. Salary ranges with 'to' wording
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 5. k-based salary ranges
    /\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k/gi,

    // 6. Monthly salaries
    /\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b/gi,

    // 7. Single salary mentions (lowest priority)
    /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi,
  ];

  // Find the first match in order of priority
  for (const pattern of patterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }

  return "";
}

export const decodeHTMLEntities = (str) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

export function processJobPostings(jobs) {
  return jobs.map((job) => {
    const keywords = scanKeywords(job.description);
    const remoteKeyword = job.location?.toLowerCase().includes('remote') ? 'Remote' : "";
    const salary = extractSalary(job.description);

    return {
      id: job.job_id,
      title: job.title || "",
      company: job.company || "",
      summary: job.summary || "",
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