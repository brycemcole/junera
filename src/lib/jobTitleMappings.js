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
        'web developer',
        'mobile developer',
        'ios developer',
        'android developer',
        'game developer',
        'blockchain developer',
        'embedded systems developer',
        'api developer',
        'firmware developer'
    ],

    // Data Science Group
    [
        'data scientist',
        'data analyst',
        'machine learning engineer',
        'ml engineer',
        'data engineer',
        'analytics engineer',
        'ai researcher',
        'biostatistician',
        'quantitative analyst',
        'big data engineer',
        'data visualization specialist',
        'statistical modeler'
    ],

    // DevOps Group
    [
        'devops engineer',
        'site reliability engineer',
        'platform engineer',
        'cloud engineer',
        'infrastructure engineer',
        'systems engineer',
        'build and release engineer',
        'network engineer',
        'security engineer',
        'automation engineer',
        'kubernetes engineer',
        'linux administrator'
    ],

    // Product/Project Management Group
    [
        'product manager',
        'program manager',
        'project manager',
        'technical product manager',
        'product owner',
        'scrum master',
        'business analyst',
        'it project manager',
        'agile coach'
    ],

    // Design Group
    [
        'ui designer',
        'ux designer',
        'product designer',
        'visual designer',
        'graphic designer',
        'web designer',
        'motion graphics designer',
        'interaction designer',
        'industrial designer',
        '3d designer',
        'design researcher',
        'service designer',
        'game designer'
    ],

    // Quality Assurance Group
    [
        'qa engineer',
        'quality assurance engineer',
        'test automation engineer',
        'manual tester',
        'performance tester',
        'security tester',
        'usability tester',
        'quality analyst',
        'software tester'
    ],

    // Marketing Group
    [
        'marketing manager',
        'digital marketing specialist',
        'seo specialist',
        'content strategist',
        'social media manager',
        'brand manager',
        'email marketing specialist',
        'growth marketer',
        'market research analyst',
        'ppc specialist',
        'advertising manager'
    ],

    // Human Resources Group
    [
        'hr manager',
        'recruiter',
        'technical recruiter',
        'talent acquisition specialist',
        'compensation analyst',
        'employee relations specialist',
        'hr generalist',
        'benefits coordinator',
        'training and development manager',
        'diversity and inclusion officer'
    ],

    // Sales Group
    [
        'sales representative',
        'business development manager',
        'account executive',
        'sales engineer',
        'customer success manager',
        'solutions architect',
        'account manager',
        'inside sales representative',
        'field sales representative',
        'key account manager'
    ],

    // Operations Group
    [
        'operations manager',
        'logistics coordinator',
        'supply chain analyst',
        'process improvement specialist',
        'operations analyst',
        'inventory manager',
        'production planner',
        'procurement specialist',
        'warehouse manager',
        'lean consultant'
    ],

    // Hardware Engineering Group
    [
        'hardware engineer',
        'electronics engineer',
        'semiconductor engineer',
        'circuit design engineer',
        'pcb designer',
        'analog design engineer',
        'digital design engineer',
        'rf engineer',
        'embedded hardware engineer',
        'verification engineer',
        'microelectronics engineer',
        'chip design engineer',
        'vlsi engineer',
        'fpga engineer'
    ],

    // Legal Group
    [
        'legal counsel',
        'legal',
        'corporate lawyer',
        'intellectual property lawyer',
        'contract manager',
        'compliance officer',
        'paralegal',
        'legal assistant',
        'employment lawyer',
        'environmental lawyer',
        'tax lawyer',
        'general counsel',
        'litigation attorney',
        'patent attorney',
        'trademark attorney',
        'legal researcher'
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
