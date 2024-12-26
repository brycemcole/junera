// Job title groups - each array represents related positions
export const jobTitleGroups = [
    // Software Development Group
    [
        'software engineer',
        'software developer',
        'frontend engineer',
        'frontend developer',
        'backend engineer',
        'backend developer',
        'fullstack engineer',
        'full stack developer',
        'python developer',
        'c++ developer',
        'rust developer',
        'java developer',
        'javascript developer',
        'web developer'
    ],

    // Data Science Group
    [
        'data scientist',
        'data analyst',
        'machine learning engineer',
        'ml engineer',
        'data engineer',
        'analytics engineer'
    ],

    // DevOps Group
    [
        'devops engineer',
        'site reliability engineer',
        'platform engineer',
        'cloud engineer',
        'infrastructure engineer',
        'systems engineer'
    ],

    // Product/Project Management Group
    [
        'product manager',
        'program manager',
        'project manager',
        'technical product manager',
        'product owner'
    ],

    // Design Group
    [
        'ui designer',
        'ux designer',
        'product designer',
        'visual designer',
        'graphic designer',
        'web designer'
    ]
];

// Function to find the group containing a job title
export function findJobTitleGroup(searchTitle) {
    const normalizedSearch = searchTitle.toLowerCase().trim();

    // Find the group that contains the search term
    const group = jobTitleGroups.find(group =>
        group.some(title => title.toLowerCase().includes(normalizedSearch))
    );

    // Return the found group or an array with just the search term
    return group || [normalizedSearch];
}
