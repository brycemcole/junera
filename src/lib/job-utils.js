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

function formatSalaryRange(match, pattern) {
  let salaryText = match[0];
  
  // Convert k notation to full numbers
  if (pattern.includes('k')) {
    salaryText = salaryText.replace(/(\d+\.?\d*)k/gi, (_, num) => num * 1000);
  }

  // Extract numbers from the text
  const numbers = salaryText.match(/\d+(,\d+)*(\.\d+)?/g)
    .map(num => parseFloat(num.replace(/,/g, '')));

  if (numbers.length === 0) return salaryText;

  // Determine salary type based on value
  const maxValue = Math.max(...numbers);
  
  // Hourly rate (< 100)
  if (maxValue < 100 || pattern.includes('hour') || pattern.includes('hr') || pattern.includes('h')) {
    const formatted = numbers.map(num => `$${num.toFixed(2)}`).join(' - ');
    return `${formatted}/hr`;
  }
  // Monthly rate (1000-20000)
  else if (maxValue >= 1000 && maxValue < 20000 || pattern.includes('month') || pattern.includes('mo')) {
    const formatted = numbers.map(num => `$${num.toLocaleString()}`).join(' - ');
    return `${formatted}/month`;
  }
  // Yearly rate (≥20000)
  else {
    const formatted = numbers.map(num => `$${num.toLocaleString()}`).join(' - ');
    return `${formatted}/year`;
  }
}

export function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags safely
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize text
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();

  // Helper function to validate and format amount
  const formatAmount = (amount, context) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return null;
    
    const hasCommas = amount.includes(',');
    const isHourlyContext = context.toLowerCase().match(/\b(?:hour|hr|hourly)\b/i);
    const isSalaryContext = context.toLowerCase().match(/\b(?:salary|annual|yearly)\b/i);
    
    // If amount has commas, preserve the format as is
    if (hasCommas) {
      return isSalaryContext ? `$${num.toLocaleString()}/year` : `$${num.toLocaleString()}/hr`;
    }
    
    // If explicitly mentioned as hourly or number is small without salary context
    if (isHourlyContext || (num < 100 && !isSalaryContext)) {
      return `$${num.toFixed(2)}/hr`;
    }
    
    // Default to keeping number as is for hourly rate
    return `$${num}${num % 1 ? '' : '.00'}/hr`;
  };

  const parseNumber = (num, context = '') => {
    if (!num) return null;
    
    // Clean the input
    const cleaned = num.toString().toLowerCase().trim();
    
    // Only convert to thousands if explicitly formatted with commas or 'k'
    if (cleaned.includes(',')) {
      return parseFloat(cleaned.replace(/,/g, ''));
    }
    
    if (cleaned.includes('k')) {
      return parseFloat(cleaned) * 1000;
    }
    
    // Otherwise, keep number as is
    return parseFloat(cleaned);
  };

  const patterns = [
    // Exact pattern for hourly rate ranges
    {
      regex: /salary\s+range.*?\$(\d+(?:\.\d{1,2})?)\s*(?:to|-|and|\s)*\s*\$(\d+(?:\.\d{1,2})?)\s*(?:per\s+hour|\/\s*hour|\/\s*hr|hourly)/i,
      extract: (match) => {
        const [_, first, second] = match;
        // If the numbers already have decimals, use them as is
        const firstHasDecimals = first.includes('.');
        const secondHasDecimals = second.includes('.');
        const firstNum = parseFloat(first);
        const secondNum = parseFloat(second);
        
        return `$${firstNum.toFixed(firstHasDecimals ? 2 : 0)}${!firstHasDecimals ? '.00' : ''} - $${secondNum.toFixed(secondHasDecimals ? 2 : 0)}${!secondHasDecimals ? '.00' : ''}/hr`;
      }
    },
    // Exact S&P Global format pattern with hourly context check
    {
      regex: /S&P\s+Global\s+states\s+that\s+the\s+anticipated\s+base\s+(?:salary|hourly\s+rate).*?\$(\d+(?:\.\d{1,2})?)\s*(?:to|-|and|\s)*\s*\$(\d+(?:\.\d{1,2})?)/i,
      extract: (match) => {
        const [full, first, second] = match;
        const firstNum = parseFloat(first);
        const secondNum = parseFloat(second);
        
        // Check if explicitly mentioned as hourly
        const isHourly = full.toLowerCase().includes('hourly') || 
                        (firstNum < 100 && secondNum < 100) ||
                        !full.toLowerCase().includes('salary');
        
        if (isHourly) {
          return `$${firstNum.toFixed(2)} - $${secondNum.toFixed(2)}/hr`;
        }
        
        // Keep original decimal places if they exist, otherwise add .00
        return `$${firstNum.toLocaleString()}${!first.includes('.') ? '.00' : ''} - $${secondNum.toLocaleString()}${!second.includes('.') ? '.00' : ''}/year`;
      }
    },
    // Primary check for explicit salary context
    {
      regex: /\$(\d{1,3}(?:,\d{3})*|\d+)(?:\.?\d*)?(?:\s*(?:to|-|–|—|\s+to\s+)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\.?\d*)?/i,
      extract: (match) => {
        const [full, first, second] = match;
        
        // Keep numbers exactly as they appear in the text
        const firstNum = parseFloat(first.replace(/,/g, ''));
        const secondNum = parseFloat(second.replace(/,/g, ''));
        
        if (!firstNum || !secondNum) return null;
        
        // If numbers are under 100, format as hourly
        if (firstNum < 100 && secondNum < 100) {
          return `$${firstNum.toFixed(2)} - $${secondNum.toFixed(2)}/hr`;
        }
        
        // If numbers contain commas, they're already in thousands
        if (first.includes(',') || second.includes(',')) {
          return `$${firstNum.toLocaleString()} - $${secondNum.toLocaleString()}/year`;
        }
        
        // Otherwise, keep the numbers exactly as they are
        return `$${firstNum}${firstNum % 1 ? '' : '.00'} - $${secondNum}${secondNum % 1 ? '' : '.00'}/hr`;
      }
    },
    // Handle multi-line or formatted salary ranges
    {
      regex: /base\s+(?:salary|pay).*?\$(\d{1,3}(?:,\d{3})*|\d+)(?:,000)?[\s\S]{0,100}?(?:and|to|-)\s*\$?(\d{1,3}(?:,\d{3})*|\d+)(?:,000)?/i,
      extract: (match) => {
        const [full, first, second] = match;
        // Only process if it's clearly about salary
        if (!full.toLowerCase().match(/(?:salary|pay|compensation|annual|yearly|expected)/i)) return null;
        
        const firstNum = parseNumber(first, 'annual');
        const secondNum = parseNumber(second, 'annual');
        
        // Extra validation for annual salary ranges
        if (firstNum >= 10000 && secondNum >= 10000 && secondNum > firstNum && secondNum <= firstNum * 3) {
          return `$${firstNum.toLocaleString()} - $${secondNum.toLocaleString()}/year`;
        }
        return null;
      }
    },
    // Unified pattern for salary ranges with context
    {
      regex: /(?:annual|yearly|base|expected)?\s*(?:salary|pay|compensation)?.*?(?:between\s*)?\$(\d{1,3}(?:,\d{3})*|\d+)(?:,000|\s*k)?(?:\s*(?:and|to|-|\s+to\s+)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:,000|\s*k)?/i,
      extract: (match) => {
        const [full, first, second] = match;
        
        // Only process if in a relevant context or explicitly mentions salary
        const hasContext = full.toLowerCase().match(/(?:salary|pay|compensation|annual|yearly|expected)/i);
        if (!hasContext) return null;
        
        const firstNum = parseNumber(first, full);
        const secondNum = parseNumber(second, full);
        
        // Validation
        if (!firstNum || !secondNum || firstNum >= secondNum) return null;
        if (firstNum < 1000 && !full.toLowerCase().includes('hour')) return null;
        
        // Format based on range
        if (firstNum < 100) return `$${firstNum.toFixed(2)} - $${secondNum.toFixed(2)}/hr`;
        if (firstNum < 20000) return `$${firstNum.toLocaleString()} - $${secondNum.toLocaleString()}/month`;
        return `$${firstNum.toLocaleString()} - $${secondNum.toLocaleString()}/year`;
      }
    },
    // Annual base pay pattern with strict validation
    {
      regex: /annual\s+base\s+pay.*?between\s+\$(\d{1,3}(?:,\d{3})*|\d+)(?:,000)?(?:\s*(?:and|to|-)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:,000)?/i,
      extract: (match) => {
        const [full, first, second] = match;
        const firstNum = parseNumber(first, 'annual');
        const secondNum = parseNumber(second, 'annual');
        
        // Validate range is reasonable for annual salary
        if (firstNum >= 10000 && secondNum >= 10000 && secondNum > firstNum) {
          return `$${firstNum.toLocaleString()} - $${secondNum.toLocaleString()}/year`;
        }
        return null;
      }
    },
    // Existing patterns for single values...
    {
      regex: /(?:annual|yearly|base)\s+(?:salary|pay|compensation).*?(?:between\s*)?\$(\d{1,3}(?:,\d{3})*|\d+)(?:,000|\s*k)?(?:\s*(?:and|to|-|\s+to\s+)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:,000|\s*k)?/i,
      extract: (match) => {
        let [_, first, second] = match;
        const parseNumber = (num) => {
          if (num.includes(',')) return parseFloat(num.replace(/,/g, ''));
          if (num.toLowerCase().includes('k')) return parseFloat(num) * 1000;
          const parsed = parseFloat(num);
          return parsed < 1000 ? parsed * 1000 : parsed;
        };
        
        first = parseNumber(first);
        second = parseNumber(second);
        return `$${first.toLocaleString()} - $${second.toLocaleString()}/year`;
      }
    },
    // Match "expected to be between" format specifically
    {
      regex: /expected\s+to\s+be\s+between\s+\$(\d{1,3}(?:,\d{3})*|\d+)(?:,000|\s*k)?(?:\s*(?:and|to|-)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:,000|\s*k)?/i,
      extract: (match) => {
        let [_, first, second] = match;
        first = first.includes(',') ? parseFloat(first.replace(/,/g, '')) : 
               first.toLowerCase().includes('k') ? parseFloat(first) * 1000 :
               parseFloat(first) * (first.length <= 3 ? 1000 : 1);
        second = second.includes(',') ? parseFloat(second.replace(/,/g, '')) : 
                second.toLowerCase().includes('k') ? parseFloat(second) * 1000 :
                parseFloat(second) * (second.length <= 3 ? 1000 : 1);
        return `$${first.toLocaleString()} - $${second.toLocaleString()}/year`;
      }
    },
    // Special case for "expected to be between" with prorating text
    {
      regex: /expected\s+to\s+be\s+between\s+\$(\d{1,3}(?:,\d{3})*|\d+)(?:,000)?(?:\s*(?:and|to|-)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:,000)?(?:\s+which\s+will\s+be\s+prorated)?/i,
      extract: (match) => {
        let [_, first, second] = match;
        const parseNumber = (num) => {
          if (num.includes(',')) return parseFloat(num.replace(/,/g, ''));
          // For numbers without commas in this format, always multiply by 1000
          return parseFloat(num) * 1000;
        };
        
        first = parseNumber(first);
        second = parseNumber(second);
        
        // Additional validation for this specific case
        if (first >= 50000 && second >= 50000) {  // Typical annual salary range check
          return `$${first.toLocaleString()} - $${second.toLocaleString()}/year`;
        }
        return null;
      }
    },
    // Match salary ranges with explicit context
    {
      regex: /(?:anticipated|base)\s+salary\s+(?:range\s+)?.*?\$(\d{1,3}(?:,\d{3})*|\d+)(?:\.?\d*)?(?:\s*(?:to|-|–|—|\s+to\s+)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\.?\d*)?/i,
      extract: (match) => {
        const [full, first, second] = match;
        const firstNum = parseNumber(first, full);
        const secondNum = parseNumber(second, full);
        
        if (!firstNum || !secondNum) return null;
        
        // If numbers are small and context mentions hourly/hour, format as hourly
        if (full.toLowerCase().match(/\b(?:hour|hr|hourly)\b/i) || (firstNum < 100 && secondNum < 100)) {
          return `$${firstNum.toFixed(2)} - $${secondNum.toFixed(2)}/hr`;
        }
        
        // If explicitly mentioned as annual/salary/yearly, format as year
        if (full.toLowerCase().match(/\b(?:annual|yearly|salary)\b/i)) {
          return `$${firstNum.toLocaleString()} - $${secondNum.toLocaleString()}/year`;
        }
        
        // Default: just show the numbers as they are
        return `$${firstNum}${firstNum % 1 ? '' : '.00'} - $${secondNum}${secondNum % 1 ? '' : '.00'}/hr`;
      }
    },
    // Specific pattern for S&P Global format
    {
      regex: /(?:S&P\s+Global|company)\s+states\s+that\s+the\s+anticipated\s+base\s+salary.*?\$(\d{1,3}(?:,\d{3})*|\d+)(?:\.?\d*)?(?:\s*(?:to|-|–|—|\s+to\s+)\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\.?\d*)?/i,
      extract: (match) => {
        const [full, first, second] = match;
        // Don't multiply by 1000 unless there are commas
        const firstNum = parseFloat(first.replace(/,/g, ''));
        const secondNum = parseFloat(second.replace(/,/g, ''));
        
        if (!firstNum || !secondNum) return null;
        
        // If both numbers are small (< 100), assume hourly
        if (firstNum < 100 && secondNum < 100) {
          return `$${firstNum.toFixed(2)} - $${secondNum.toFixed(2)}/hr`;
        }
        
        // Otherwise keep numbers as they are found in the text
        return `$${firstNum}${firstNum % 1 ? '' : '.00'} - $${secondNum}${secondNum % 1 ? '' : '.00'}/hr`;
      }
    },
    // Rest of existing patterns...
    {
      regex: /compensation:?\s*\$(\d+(?:\.\d+)?)\s*(?:USD)?\s*(?:hourly|monthly|annual|yearly)?(?:\s*rate)?/i,
      extract: (match) => formatAmount(match[1], match[0])
    },
    {
      regex: /\$(\d+(?:\.\d+)?)\s*(?:USD)?\s*(?:per\s*hour|hourly|hr)/i,
      extract: (match) => formatAmount(match[1], 'hourly')
    },
    {
      regex: /(?:salary|pay|rate|compensation)?\s*(?:range|:)?\s*\$(\d+(?:\.\d+)?)\s*(?:USD)?/i,
      extract: (match) => formatAmount(match[1], match[0])
    }
  ];

  // Try each pattern in order with strict validation
  for (const { regex, extract } of patterns) {
    const match = normalizedText.match(regex);
    if (match) {
      const result = extract(match);
      if (result && 
          !result.includes('NaN') && 
          !result.includes('undefined') &&
          !result.match(/\$0[\/\s]/) && // Prevent zero values
          !result.match(/\$\d{1,2}\/year/) // Prevent small numbers as yearly
      ) {
        return result;
      }
    }
  }

  return "";
}

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
  const allowedTags = ['p', 'ul', 'li', 'ol', 'u', 'b', 'i', 'strong', 'em'];
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
      postedDate: job.created_at ? job.created_at?.toISOString() : "",
      remoteKeyword: remoteKeyword,
      keywords: keywords,
    };
  });
}