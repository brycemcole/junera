'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from "date-fns";
import AlertDemo from "./AlertDemo";
import { useAuth } from '@/context/AuthContext';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import EnhanceJobPopover from "./enhance-popover";
import Link from "next/link";
import Button24 from "@/components/button24"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import NumberButton from "@/components/ui/number-button";
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowRight, Briefcase, Flag, Mail, MapPin, Sparkle, Timer, User, Wand2, Zap, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "../../../components/job-posting";
import { CollapsibleDemo } from "./collapsible";
import { StickyNavbar } from './navbar';
const stripHTML = (str) => {
  const allowedTags = ['b', 'i', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'p', 'br', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'];
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, 'text/html');

  // Remove disallowed tags
  const elements = doc.body.querySelectorAll('*');
  elements.forEach((el) => {
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(document.createTextNode(el.textContent));
    }
  });

  // Reset font size to match the parent
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    const parentFontSize = computedStyle.getPropertyValue('font-size');
    el.style.fontSize = parentFontSize; // Reset the font size to parent
  });

  return doc.body.innerHTML;
};
const decodeHTMLEntities = (str) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

export function CopyButton() {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="disabled:opacity-100"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            disabled={copied}
          >
            <div
              className={cn(
                "transition-all",
                copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              <Check className="stroke-emerald-500" size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            <div
              className={cn(
                "absolute transition-all",
                copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
              )}
            >
              <Copy size={16} strokeWidth={2} aria-hidden="true" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="border border-input bg-popover px-2 py-1 text-xs text-muted-foreground">
          Click to copy
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


export default function JobPostingPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); 
  const [showAlert, setShowAlert] = useState(false);
  const [llmResponse, setLlmResponse] = useState("");
  const [userProfile, setUserProfile] = useState(null);


    // Handle predefined question click with profile context
    const handlePredefinedQuestion = async (e) => {
        if (!user) return;
        let question = e.currentTarget.textContent;
        if (!question) return;
        console.log('Predefined question:', question);

        if (!userProfile) {
            setLlmResponse("Loading user profile...");
            return;
        }
        const jobPosting = data.jobPosting;

        const technicalSkills = userProfile.user.technical_skills || 'None specified';
        const softSkills = userProfile.user.soft_skills || 'None specified';
        const otherSkills = userProfile.user.other_skills || 'None specified';

        // Modify the question for better clarity
        const modifiedQuestion = `Does ${userProfile.user.firstname} qualify for the job titled "${jobPosting.title}" at ${jobPosting.companyName}? Please provide a match score out of 100 and a brief explanation.`;
        const matchSchema = {
          type: "json_schema",
          json_schema: {
            name: "job_match",
            schema: {
              type: "object",
              properties: {
                field: { type: "string" },
              },
              required: [
                "field"
              ]
            }
          }
        };
        // Create a detailed system message with prioritized job posting information
        const systemMessage = {
            role: "system",
            content: `
You are a helpful career assistant evaluating job fit for ${userProfile.user.firstname} ${userProfile.user.lastname}.

### User Profile:
- **Professional Summary:** ${userProfile.user.professionalSummary || 'No summary available.'}
- **Technical Skills:** ${technicalSkills}
- **Soft Skills:** ${softSkills}
- **Other Skills:** ${otherSkills}
- **Desired Job Title:** ${userProfile.user.desired_job_title || 'Not specified'}
- **Preferred Location:** ${userProfile.user.desired_location || 'Any location'}
- **Preferred Salary:** $${userProfile.user.jobPreferredSalary || 'Not specified'}
- **Employment Type:** ${userProfile.user.employment_type || 'Not specified'}
- **Preferred Industries:** ${userProfile.user.preferred_industries || 'Not specified'}
- **Willing to Relocate:** ${userProfile.user.willing_to_relocate ? 'Yes' : 'No'}

### Work Experience
${userProfile.experience && userProfile.experience.length > 0 
? userProfile.experience.map(exp => 
    `- **${exp.title}** at **${exp.companyName}** (${new Date(exp.startDate).toLocaleDateString()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()})
- **Location**: ${exp.location || 'Not specified'}
- **Description**: ${exp.description || 'No description available'}
- **Tags**: ${exp.tags || 'No tags available'}`).join('\n\n')
: 'No work experience available.'}

### Education
${userProfile.education && userProfile.education.length > 0
? userProfile.education.map(edu => 
    `- **${edu.degree} in ${edu.fieldOfStudy}** from **${edu.institutionName}**
- **Duration**: ${new Date(edu.startDate).toLocaleDateString()} - ${edu.isCurrent ? 'Present' : new Date(edu.endDate).toLocaleDateString()}
- **Grade**: ${edu.grade || 'Not specified'}
- **Activities**: ${edu.activities || 'No activities specified'}`).join('\n\n')
: 'No education details available.'}

### Job Posting Details:
${JSON.stringify(jobPosting)}

Please assess the qualifications and provide a brief explanation of whether the user is a good fit for this job.
            `,
        };
        console.log('System message:', systemMessage.content);

        const userMessage = { role: "user", content: modifiedQuestion };
        const newMessages = [systemMessage, userMessage];
        setLlmResponse("Loading...");

        try {
            const response = await fetch("http://localhost:1234/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "qwen2-7b-instruct",
                    messages: newMessages,
                    temperature: 0.7,
                    max_tokens: 500,
                    stream: false,
                }),
            });

            const data = await response.json();
            const content = data.choices[0]?.message?.content || "No response.";
            setLlmResponse(content);
        } catch (error) {
            console.error("Error fetching LLM response:", error);
            setLlmResponse("Failed to get a response. Please try again.");
        }
    };

    useEffect(() => {
        async function fetchUserProfile() {
            if (user) {
                try {
                    const response = await fetch('/api/user/profile', {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });
                    const profile = await response.json();
                    setUserProfile(profile);
        
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        }
        
        fetchUserProfile();
    }, [user]);

  // Add handler for badge clicks
  const handleBadgeClick = () => {
      setShowAlert(true);
  };
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token found:', !!token); // Debug log
        
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`/api/job-postings/${id}`, { headers });
        
        if (!response.ok) throw new Error('Failed to fetch job data');
        const result = await response.json();
        setData(result);

        // Track view in a separate try-catch block
        if (token) {
          try {
            console.log('Attempting to track view...'); // Debug log
            const viewResponse = await fetch(`/api/job-postings/${id}/view`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (!viewResponse.ok) {
              console.error('Failed to track view:', await viewResponse.text());
            }
          } catch (viewError) {
            console.error('Error tracking view:', viewError);
          }
        }
      } catch (err) {
        console.error('Error fetching job data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.jobPosting) return <div>Job posting not found.</div>;

  const { jobPosting, relatedPostings = { similarPostings: [], sameCompanyPostings: [] }, isBookmarked, keywords } = data;

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <StickyNavbar 
        title={jobPosting.title}
        companyName={jobPosting.companyName}
        companyLogo={jobPosting.logo}
        companyId={jobPosting.company_id}
      />
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/companies/${jobPosting.company_id}`}>{jobPosting.companyName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{jobPosting.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h3 className="text-md font-semibold text-neutral-600 hover:underline hover-offset-4">
        
        <Link className="flex flex-row items-center gap-4" href={`/companies/${jobPosting.company_id}`}>
        <Avatar alt={jobPosting.companyName} className="w-8 h-8 rounded-full">
        <AvatarImage src={jobPosting.logo} />
        <AvatarFallback>{jobPosting.companyName?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {jobPosting.companyName}
      </Link>
      </h3>
      <h1 data-scroll-title className="text-2xl mb-2 font-semibold decoration-2 leading-normal min-w-0">{jobPosting.title}</h1>
      {keywords && keywords.length > 0 && (
  <div className="mb-4">
    <ul className="flex flex-wrap gap-2">
      {keywords.map((keyword, index) => {
        const colors = [
          { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-50" },
          { bg: "bg-green-50", text: "text-green-600", border: "border-green-50" },
          { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-50" },
          { bg: "bg-red-50", text: "text-red-600", border: "border-red-50" },
          { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-50" },
        ];

        const color = colors[index % colors.length]; // Rotate colors based on index

        return (
          <Badge
            key={index}
            variant="outline"
            className={`${color.bg} ${color.text} rounded-md text-sm sm:text-[13px] font-medium ${color.border}`}
          >
            {keyword}
          </Badge>
        );
      })}
    </ul>
  </div>
)}
      <div className="mb-2 flex flex-wrap gap-4 gap-y-1 text-md font-medium text-neutral-500 items-start">
        {jobPosting.salary_range_str && (
          <div className="flex items-center gap-1">
            <Zap className="h-[14px] w-[14px] sm:h-4 sm:w-4" />
            <span>{jobPosting.salary_range_str}</span>
            </div>
        )}
<div className="flex items-center gap-1">
{(jobPosting?.salary && Number(jobPosting.salary) > 0) || (jobPosting?.salary_max && Number(jobPosting.salary_max) > 0) ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-[14px] w-[14px] sm:h-4 sm:w-4" />
            <span>
              {jobPosting.salary && jobPosting.salary_max
                ? `$${Number(jobPosting.salary).toLocaleString()} - $${Number(jobPosting.salary_max).toLocaleString()}`
                : jobPosting.salary_range_str}
            </span>
          </div>
        ) : null}
  <User
    className={`h-[14px] w-[14px] sm:h-4 sm:w-4 ${
      jobPosting.applicants === 0 ? "text-green-600" : "text-gray-700"
    }`}
  />
  <span
    className={jobPosting.applicants === 0 ? "text-green-600" : "text-gray-700"}
  >
    {jobPosting.applicants === 0 
      ? "Be the first applicant" 
      : `${jobPosting.applicants} applicants`}
  </span>
</div>
        <div className="flex items-center gap-1">
          <MapPin className="h-[14px] w-[14px] sm:h-4 sm:w-4" />
          <span>{jobPosting.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="h-[14px] w-[14px] sm:h-4 sm:w-4" />
          <span>{formatDistanceToNow(jobPosting.postedDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-[14px] w-[14px] sm:h-4 sm:w-4" />
          <span>{jobPosting.experienceLevel}</span>
        </div>
      </div>

      <div className="flex flex-wrap flex-row gap-4 mt-4 mb-4">
      <Link className="w-full md:w-auto" href={`${jobPosting.link}`}>
      
      <Button className="group text-md w-full md:w-auto font-semibold text-green-50 bg-green-950" variant="" >
      <Briefcase className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
      Apply on {new URL(jobPosting.link).hostname.split('.').slice(-2, -1)[0]}
      <ArrowRight 
        className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
        size={16}
        strokeWidth={2}
        aria-hidden="true"
      />
    </Button>
</Link>
{/** 
 *         <ReportPopover />
        <EnhanceJobPopover jobPosting={jobPosting} />
 * 
*/}

        <Button24 jobId={id} />
        < CopyButton />
        </div>

        <h3 className="text-md font-semibold mb-3">Job Insights</h3>
        <div className="flex flex-wrap gap-2 mb-4">
                <Badge onClick={handleBadgeClick} className="cursor-pointer bg-green-500/10" variant="secondary">
                <Sparkle size={14} strokeWidth={2} className="animate-colorChange" />                </Badge>
                <Badge onClick={handlePredefinedQuestion} className="cursor-pointer bg-green-500/10" variant="secondary">
                <User size={14} strokeWidth={2} className="animate-colorChange mr-2" /> 

                  <p className="text-sm px-1 py-0.5 font-semibold text-green-700">
                    Am I a good fit?
                    </p>
                </Badge>
                <Badge onClick={handleBadgeClick} className="cursor-pointer bg-green-500/10" variant="secondary">
                <Briefcase size={14} strokeWidth={2} className="animate-colorChange mr-2" /> 

                <p className="text-sm px-1 py-0.5 font-semibold text-green-700">
                What should I say in my cover letter?
                    </p>
                </Badge>

            </div>
            {llmResponse && (
                <div className="mb-6 p-4 border rounded-md ">
                    <div dangerouslySetInnerHTML={{ __html: llmResponse }} />
                </div>
            )}

            {showAlert && <AlertDemo />}
      <div className="prose-td code:display-inline-block prose-td code:bg-gray-200 prose-td code:px-2 prose-td code:py-1 prose-td code:rounded-md prose prose-headings:mb-[0.7em] prose-headings:mt-[1.25em] prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-[32px] prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-p:mb-4 prose-p:mt-0 prose-p:leading-relaxed prose-p:before:hidden prose-p:after:hidden prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-neutral-500 prose-blockquote:before:hidden prose-blockquote:after:hidden prose-code:my-0 prose-code:inline-block prose-code:rounded-md prose-code:bg-neutral-100 prose-code:px-2 prose-code:text-[85%] prose-code:font-normal prose-code:leading-relaxed prose-code:text-primary prose-code:before:hidden prose-code:after:hidden prose-pre:mb-4 prose-pre:mt-0 prose-pre:whitespace-pre-wrap prose-pre:rounded-lg prose-pre:bg-neutral-100 prose-pre:px-3 prose-pre:py-3 prose-pre:text-base prose-pre:text-primary prose-ol:mb-4 prose-ol:mt-1 prose-ol:pl-8 marker:prose-ol:text-primary prose-ul:mb-4 prose-ul:mt-1 prose-ul:pl-8 marker:prose-ul:text-primary prose-li:mb-0 prose-li:mt-0.5 prose-li:text-primary first:prose-li:mt-0 prose-table:w-full prose-table:table-auto prose-table:border-collapse prose-th:break-words prose-th:text-center prose-th:font-semibold prose-td:break-words prose-td:px-4 prose-td:py-2 prose-td:text-left prose-img:mx-auto prose-img:my-12 prose-video:my-12 max-w-none overflow-auto py-5 text-primary">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-description">
        {[
          { key: 'companyDescription', label: 'Company Description' },
          { key: 'description', label: 'Job Description' },
          { key: 'responsibilities', label: 'Responsibilities' },
          { key: 'requirements', label: 'Requirements' },
          { key: 'Benefits', label: 'Benefits' },
          { key: 'MinimumQualifications', label: 'Minimum Requirements' },
          { key: 'relocation', label: 'Relocation Assistance' },
          { key: 'EqualOpportunityEmployerInfo', label: 'Equal Opportunity Employer Info' },
          { key: 'IsRemote', label: 'Remote Work Availability' },
          { key: 'H1BVisaSponsorship', label: 'H1B Visa Sponsorship' },
          { key: 'HoursPerWeek', label: 'Hours Per Week' },
          { key: 'Schedule', label: 'Schedule' },
          { key: 'NiceToHave', label: 'Nice to Have' },
          { key: 'raw_description_no_format', label: 'Job Link Description' }

        ].map(({ key, label }) => (
          typeof jobPosting[key] === 'string' && jobPosting[key].length > 4 && (
              <AccordionItem className="text-md" key={key} value={`item-${key}`}>
                  <AccordionTrigger className="text-md font-semibold md:text-lg">{label}</AccordionTrigger>
                  <AccordionContent className="leading-loose">
                    <div>
                    <div
  dangerouslySetInnerHTML={{
    __html: stripHTML(decodeHTMLEntities(jobPosting[key])),
  }}
/>

                    </div>
                  </AccordionContent>
              </AccordionItem>
          )
        ))}
      </Accordion>
</div>
<div className="flex flex-col space-y-2 mb-4">
          <p className="text-blue-500 font-medium hover:underline underline-offset-4">
          <Link href={`/job-postings?explevel=${encodeURIComponent(jobPosting.experienceLevel)}`}>
          See more {jobPosting.experienceLevel} jobs
          </Link>
          </p>
          <p className="text-blue-500 font-medium hover:underline underline-offset-4">
          <Link href={`/job-postings?location=${encodeURIComponent(jobPosting.location.trim())}`}>
            See jobs in {jobPosting.location.trim()}
            </Link>
            </p>
        <p className="text-blue-500 font-medium hover:underline underline-offset-4">
        <Link href={`/job-postings?title=${encodeURIComponent(jobPosting.title.trim())}`}>
        See more {jobPosting.title.trim()} jobs
        </Link>

        </p>
      </div>
      <CollapsibleDemo 
        title="Similar Job Postings" 
        open={true}
        jobPostings={relatedPostings.similarPostings} 
      />
      
      {relatedPostings.similarPostings.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          No similar job postings found.
        </div>
      )}

      <CollapsibleDemo
        title={`More Jobs at ${jobPosting.companyName}`}
        jobPostings={relatedPostings.sameCompanyPostings}
      />

      {relatedPostings.sameCompanyPostings.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          No additional job postings from this company.
        </div>
      )}
    </div>
  );
}

export function CompanyHoverCard({ companyName, companyLogo, companyDescription, companyId }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild className="p-0">
        <Button variant="link" className="p-0 text-lg font-semibold">
                                      <Avatar alt={companyName} className="w-8 h-8 rounded-full">
                            <AvatarImage src={companyLogo} />
                            <AvatarFallback>{companyName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>          
          {companyName}</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 mx-4">
        <Link href={`/companies/${companyId}`}>
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src={companyLogo || "https://via.placeholder.com/150"} />
            <AvatarFallback>{companyName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{companyName}</h4>
            <p className="text-sm">
              {companyDescription}
            </p>
          </div>
        </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}

export function ReportPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline"><Flag /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mx-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Report Job Posting</h4>
            <p className="text-sm text-muted-foreground">
              Report an issue with this job posting
            </p>
          </div>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="missingInformation"
                  name="issueType"
                  value="missingInformation"
                  className="h-4 w-4"
                />
                <label htmlFor="missingInformation" className="text-sm">
                  Missing Information
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="inactiveJob"
                  name="issueType"
                  value="inactiveJob"
                  className="h-4 w-4"
                />
                <label htmlFor="inactiveJob" className="text-sm">
                  Inactive Job Posting
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="incorrectDetails"
                  name="issueType"
                  value="incorrectDetails"
                  className="h-4 w-4"
                />
                <label htmlFor="incorrectDetails" className="text-sm">
                  Incorrect Job Details
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="other"
                  name="issueType"
                  value="other"
                  className="h-4 w-4"
                />
                <label htmlFor="other" className="text-sm">
                  Other
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="comments" className="text-sm font-medium">
                Additional Comments (optional)
              </label>
              <textarea
                id="comments"
                rows="3"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                placeholder="Provide more details here..."
              ></textarea>
            </div>
            <Button type="submit">Submit Report</Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}