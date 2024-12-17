'use client';

import { useEffect, useState, Suspense } from 'react';
import { React, use } from 'react';
import { formatDistanceToNow, set } from "date-fns";
import AlertDemo from "./AlertDemo";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bolt, ChevronDown, CircleAlert, CopyPlus, Ellipsis, Files, Layers2, Loader2, Loader2Icon } from "lucide-react";
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
import { ArrowRight, Briefcase, Bell, Flag, Mail, MapPin, Sparkle, Timer, User, Wand2, Zap, DollarSign, Sparkles, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "../../../components/job-posting";
import { CollapsibleJobs } from "./collapsible";
import { StickyNavbar } from './navbar';
const stripHTML = (str) => {
  const allowedTags = ['b', 'i', 'strong', 'br', 'em', 'u'];
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


function MagicButton({ handleSummarizationQuery }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="disabled:opacity-100 group"
        >
          <Sparkles className="group-hover:stroke-emerald-500 text-muted-foreground" size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[280px] py-3 ml-4 shadow-none" side="top">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[13px] font-medium">Generate Summary</p>
            <p className="text-xs text-muted-foreground">
              Instantly generate a summary of the job posting using AI models.
            </p>
          </div>
          <Button size="sm" className="h-7 px-2" onClick={handleSummarizationQuery}>
            Generate Summary
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}



// Create a separate component for Similar Jobs
const SimilarJobs = ({ jobTitle, experienceLevel }) => {
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarJobs = async () => {
      try {
        const response = await fetch(`/api/job-postings?title=${jobTitle}&experienceLevel=${experienceLevel}`);
        const data = await response.json();
        setSimilarJobs(data.jobPostings);
      } catch (error) {
        console.error('Error fetching similar jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarJobs();
  }, [jobTitle, experienceLevel]);

  if (loading) return <div>Loading similar jobs...</div>;

  return (
    <CollapsibleJobs
      title="Similar Job Postings"
      open={false}
      jobPostings={similarJobs}
    />
  );
};

const CompanySimilarJobs = ({ company }) => {
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarJobs = async () => {
      try {
        const response = await fetch(`/api/job-postings/?company=${company}`);
        const data = await response.json();
        setSimilarJobs(data.jobPostings);
      } catch (error) {
        console.error('Error fetching similar jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarJobs();
  }, [company]);

  if (loading) return <div>Loading similar jobs...</div>;

  return (
    <CollapsibleJobs
      title={`More Jobs at ${company}`}
      open={false}
      jobPostings={similarJobs}
    />
  );
};



function InsightsButton({ onClick }) {
  return (
    <Button variant="outline" onClick={onClick}>
      Show Insights
      <Sparkles className="-me-1 ms-2" size={16} strokeWidth={2} aria-hidden="true" />
    </Button>
  );
}

// ### Updated Utility Function: Extract Salary ###
/**
 * Extracts salary information from a given text.
 * Handles various formats such as:
 * - 'USD $100,000-$200,000'
 * - '$100k-120k'
 * - '55/hr - 65/hr'
 * - '$4200 monthly'
 * - etc.
 *
 * @param {string} text - The text to extract salary from.
 * @returns {string} - The extracted salary string or an empty string if not found.
 */
function extractSalary(text) {
  if (!text) return "";

  // Step 1: Decode HTML entities
  // Create a temporary DOM element to leverage the browser's HTML parser
  const decodedString = he.decode(text);

  // Step 2: Remove HTML tags
  const textWithoutTags = decodedString.replace(/<[^>]*>/g, ' ');

  // Step 3: Normalize HTML entities and special characters
  const normalizedText = textWithoutTags
    .replace(/\u00a0/g, ' ')       // Replace non-breaking spaces
    .replace(/&nbsp;/g, ' ')       // Replace &nbsp;
    .replace(/&mdash;/g, '—')      // Replace &mdash; with em-dash
    .replace(/&amp;/g, '&')        // Replace &amp; with &
    .replace(/&lt;/g, '<')         // Replace &lt; with <
    .replace(/&gt;/g, '>')         // Replace &gt; with >
    .trim();

  // Define regex patterns
  const patterns = [
    // 1. Salary ranges with dashes (e.g., "$128,000—$152,000 USD")
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 2. Salary ranges with 'to' wording (e.g., "$35,000 to $45,000 per year")
    /\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?/gi,

    // 3. k-based salary ranges (e.g., "$100k—$120k")
    /\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k/gi,

    // 4. Hourly ranges (e.g., "55/hr - 65/hr")
    /(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)/gi,

    // 5. Monthly salaries with at least three digits (e.g., "$4200 monthly")
    /\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b/gi,

    // 6. Single salary mentions (e.g., "$85,000")
    /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi,
  ];

  let matchesWithDollar = [];
  let matchesWithoutDollar = [];

  // Iterate through each pattern and collect matches
  for (const pattern of patterns) {
    const matches = Array.from(normalizedText.matchAll(pattern));
    for (const match of matches) {
      if (pattern.source.includes('\\$')) {
        // Patterns that require '$' are stored in matchesWithDollar
        matchesWithDollar.push({
          text: match[0].trim(),
          index: match.index
        });
      } else {
        // Patterns that do NOT require '$' are stored in matchesWithoutDollar
        matchesWithoutDollar.push({
          text: match[0].trim(),
          index: match.index
        });
      }
    }
  }

  // Function to find the match with the highest index
  const getLastMatch = (matches) => {
    return matches.reduce((prev, current) => {
      return (prev.index > current.index) ? prev : current;
    }, matches[0]);
  };

  // Prioritize matches with '$'
  if (matchesWithDollar.length > 0) {
    const lastMatch = getLastMatch(matchesWithDollar);
    return lastMatch.text;
  }
  // If no matches with '$', consider matches without '$'
  else if (matchesWithoutDollar.length > 0) {
    const lastMatch = getLastMatch(matchesWithoutDollar);
    return lastMatch.text;
  }

  // Return empty string if no matches found
  return "";
}

function BellButton({ count }) {

  const handleClick = () => {
    setCount(0);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={handleClick}
      aria-label="Notifications"
    >
      <Bell size={16} strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
          {count}
        </Badge>
      )}
    </Button>
  );
}


function Summarization({ title, message, loading, error }) {
  return (
    <div className="rounded-lg shadow-sm border border-border px-4 py-3">
      <div className="flex gap-3">
        {loading ? (
          <Loader2Icon
            size={16}
            strokeWidth={2}
            aria-hidden="true" className="text-green-500 animate-spin" />
        ) : error ? (
          <CircleAlert className="text-red-500" />
        ) : (
          <Info
            className="mt-0.5 shrink-0 text-green-500"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <div className="grow space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="list-inside list-disc text-sm text-muted-foreground">
            {loading && !message ? "Loading AI response..." : message || error}
          </p>
        </div>
      </div>
    </div>
  );
}

const JobDropdown = ({ handleSummarizationQuery }) => {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Ellipsis
            className="text-muted-foreground"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleCopy}>
          <CopyPlus size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSummarizationQuery}>
          <Sparkles size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
          Summarize Job
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function JobPostingPage({ params }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insightsShown, setInsightsShown] = useState(false);
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [llmResponse, setLlmResponse] = useState("");
  const [loadingLLMReponse, setLoadingLLMResponse] = useState(false);
  const [errorLLMResponse, setErrorLLMResponse] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const handleInghtsClick = () => {
    setInsightsShown(!insightsShown);
  };


  const handleBadgeClick = () => {
    setShowAlert(true);
  };

  const handlePredefinedQuestion = async (query) => {
    if (!user) return;
    let question = q;
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

    const modifiedQuestion = `Does ${userProfile.user.firstname} qualify for the job titled "${jobPosting.title}" at ${jobPosting.company}? Please provide a match score out of 100 and a brief explanation.`;
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
            `- **${exp.title}** at **${exp.company}** (${new Date(exp.startDate).toLocaleDateString()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()})
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
      setLoadingLLMResponse(true);
      const response = await fetch("http://192.168.86.240:1234/v1/chat/completions", {
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
      setLoadingLLMResponse(false);
    } catch (error) {
      console.error("Error fetching LLM response:", error);
      setLlmResponse("Failed to get a response. Please try again.");
      setErrorLLMResponse(error.message);
    }
  };

  const handleSummarizationQuery = async () => {
    if (!user) return;
    const jobPosting = data.data;
    console.log("Job posting:", jobPosting);

    const modifiedQuestion = `Please provide a brief summary of the job posting titled "${jobPosting.title}" at ${jobPosting.company}.`;

    console.log("Modified question:", modifiedQuestion);
    const systemMessage = {
      role: "system",
      content: `
        You are a helpful agent that works for ${jobPosting.company} to provide
        a short sentence about who the ideal candidate for this job is based on the requirements listed.
        You should prioritize requirements that a person can know if they have instantly. 
        EXAMPLE RESPONSE: 'We are seeking a ${jobPosting.title} with 4 years of experience in rust, 2 years in python, and a great attitude.'
      
        Here is the full content of the job posting:
        ${JSON.stringify(jobPosting)}
      `,
    };

    const userMessage = { role: "user", content: modifiedQuestion };
    const newMessages = [systemMessage, userMessage];
    setLlmResponse(""); // Initialize as empty string for streaming
    setLoadingLLMResponse(true);
    let fullResponse = ""; // Track complete response

    try {
      const response = await fetch("https://j488jf4d-1234.use.devtunnels.ms/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2-7b-instruct",
          messages: newMessages,
          temperature: 0.2,
          max_tokens: 200,
          stream: true,
        }),
      });

      if (!response.ok) {
        setLoadingLLMResponse(false);
        setErrorLLMResponse("Failed to get a response. Please try again.");
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          console.log("Received chunk:", chunk); // Log the raw chunk

          // Depending on your API's streaming format, adjust the parsing below
          // Example assumes OpenAI-like "data: ..." streaming format

          // Split the chunk into lines
          const lines = chunk.split("\n").filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.replace("data: ", "").trim();
              if (jsonString === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(jsonString);
                console.log("Parsed data:", parsed); // Log parsed JSON

                // Adjust based on actual response structure
                // For example, if your API uses a different structure:
                const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.content;
                if (content) {
                  fullResponse += content;
                  setLlmResponse((prev) => prev + content);
                }
              } catch (err) {
                console.error("Error parsing JSON:", err);
              }
            } else {
              // Handle cases where API does not prefix with "data: "
              try {
                const parsed = JSON.parse(line);
                console.log("Parsed data without 'data: ' prefix:", parsed);

                const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.content;
                if (content) {
                  fullResponse += content;
                  setLlmResponse((prev) => prev + content);
                }
              } catch (err) {
                console.error("Error parsing JSON without 'data: ' prefix:", err);
              }
            }
          }
        }
      }

      // After streaming is complete, update the database
      if (fullResponse) {
        try {
          const updateResponse = await fetch('/api/job-postings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              jobId: id,
              summary: fullResponse
            })
          });

          if (updateResponse.ok) {
            toast({
              title: "Summary saved",
              description: "The job summary has been updated in the database.",
              variant: "default"
            });
          } else {
            throw new Error('Failed to update summary in database');
          }
        } catch (error) {
          console.error("Error updating summary in database:", error);
          toast({
            title: "Error",
            description: "Failed to save the summary to the database.",
            variant: "destructive"
          });
        }
      }

    } catch (error) {
      console.error("Error fetching LLM response:", error);
      setLoadingLLMResponse(false);
      setErrorLLMResponse(error.message);
      setLlmResponse("Failed to get a response. Please try again.");
    } finally {
      setLoadingLLMResponse(false);
    }
  };



  // Combined useEffect for fetching both job data and user profile
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchUserProfile() {
      if (!user || !isMounted) return;
      try {
        const response = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${user.token}` },
          signal: controller.signal
        });
        const profile = await response.json();
        if (isMounted) setUserProfile(profile);
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isMounted) console.error('Error fetching user profile:', error);
      }
    }

    async function fetchCompanyJobCount(companyName) {
      try {
        const response = await fetch(`/api/companies/job-postings-count/${companyName}`, {
          signal: controller.signal
        });
        console.log('Company job count response:', response);
        const { jobPostingsCount } = await response.json();
        if (isMounted) {
          setData(prevData => ({
            ...prevData,
            jobPostingsCount
          }));
        }

      } catch (error) {
        if (error.name === 'AbortError') return;
        if (isMounted) console.error('Error fetching company job count:', error);
      }
    }

    async function fetchJobData() {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch job data
        const response = await fetch(`/api/job-postings/${id}`, {
          headers,
          signal: controller.signal
        });

        const result = await response.json();
        if (isMounted) {
          setData(result);
          setLoading(false);
          fetchCompanyJobCount(result.data.company);

          // Only track view if we successfully fetched the job data and have a token
          if (token && !sessionStorage.getItem(`viewed-${id}`)) {
            try {
              await fetch(`/api/job-postings/${id}/view`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                signal: controller.signal
              });
              // Mark this job as viewed in this session
              sessionStorage.setItem(`viewed-${id}`, 'true');
            } catch (viewError) {
              if (viewError.name !== 'AbortError') {
                console.error('Error tracking view:', viewError);
              }
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Error fetching job data:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    }
    fetchJobData();
    fetchUserProfile();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, user]); // Only depend on id and user

  const handleApplyClick = async () => {
    if (!user) return; // Only track if user is logged in

    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ jobPostingId: id }),
      });
    } catch (error) {
      console.error('Error tracking application:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data.success) return <div>Job posting not found.</div>;

  const jobPosting = data.data;
  const companyJobCount = data.jobPostingsCount;

  const { keywords, relatedPostings } = data;

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <StickyNavbar
        title={jobPosting.title}
        companyName={jobPosting.company}
        companyLogo={''}
        companyId={1}
      />
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/job-postings">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/job-postings?company=${jobPosting.company}`}>{jobPosting.company}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{jobPosting.job_id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h3 className="text-md mb-2 font-semibold text-muted-foreground hover:text-foreground hover-offset-4">

          <Link className="flex flex-row items-center gap-4" href={`/job-postings?company=${jobPosting.company}`}>
            <Avatar alt={jobPosting.company} className="w-8 h-8 rounded-full">
              <AvatarImage src={`https://logo.clearbit.com/${jobPosting.company}.com`} />
              <AvatarFallback>{jobPosting.company?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {jobPosting.company}
          </Link>
        </h3>
      </div>
      <h1 data-scroll-title className="text-2xl mb-4 font-semibold decoration-2 leading-normal min-w-0">{jobPosting.title}</h1>
      {keywords && keywords.length > 0 && (
        <div className="mb-8">
          <ul className="flex flex-wrap gap-4 gap-y-3">
            {keywords.map((keyword, index) => {
              const colors = [
                { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-600/10" },
                { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-600/10" },
                { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-600/10" },
                { bg: "bg-sky-500/10", text: "text-sky-600", border: "border-sky-600/10" },
                { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-600/10" },
                { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-600/10" },
                { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-600/10" },
                { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-600/10" },
                { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-600/10" },
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
      <div className="mb-4 flex flex-wrap gap-4 gap-y-3 text-md font-medium text-muted-foreground items-start">
        {jobPosting?.salary ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span>
              {jobPosting.salary}
            </span>
          </div>
        ) : jobPosting?.salary_range_str ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span>
              {jobPosting.salary_range_str}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">

          <User
            className={`h-[14px] w-[14px] sm:h-4 sm:w-4 ${jobPosting.applicants === 0 ? "text-green-600" : "text-muted-foreground"
              }`}
          />
          <span
            className={jobPosting.applicants === 0 ? "text-green-600" : "text-muted-foreground"}
          >
            {jobPosting.applicants === 0
              ? "Be the first applicant"
              : `${jobPosting.applicants} applicants`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>{jobPosting.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer size={16} />
          <span>{formatDistanceToNow(jobPosting.created_at, { addSuffix: true })}</span>
        </div>

        {jobPosting?.experienceLevel && (
          <>
            <div className="flex items-center gap-2">
              <Zap size={16} />
              <span>{jobPosting.experienceLevel}</span>
            </div>

          </>
        )}
      </div>

      <div className="flex flex-wrap flex-col gap-4 gap-y-3 mt-4 mb-4">
        <div>
          <Link href={`/job-postings?company=${jobPosting.company}`}>
            <NumberButton text={`More Jobs at ${jobPosting.company}`} count={companyJobCount} variant="outline" />
          </Link>
        </div>
        <div className="flex gap-2">
          <Link
            href={`${jobPosting.source_url}`}
            target="_blank"
            onClick={handleApplyClick} // Add onClick handler
          >
            <Button className="group md:w-auto text-green-600 bg-green-500/10 border border-green-600/20 hover:bg-green-500/20 hover:text-green-500">
              Apply on {new URL(jobPosting.source_url).hostname.split('.').slice(-2, -1)[0]}
              <ArrowRight
                className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Button>
          </Link>
          <Button24 jobId={id} />
          <JobDropdown handleSummarizationQuery={handleSummarizationQuery} />
        </div>


      </div>

      {(jobPosting.summary || loadingLLMReponse || llmResponse) && (
        <Summarization
          title="Job Posting Summary"
          message={llmResponse || jobPosting.summary}
          loading={loadingLLMReponse}
          error={errorLLMResponse}
        />
      )}

      {user && insightsShown && (
        <>
          <h3 className="text-md font-semibold mb-3">Quick Insights</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge onClick={handleBadgeClick} className="cursor-pointer bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-foreground/10" variant="secondary">
              <Sparkle size={14} strokeWidth={2} className="text-muted-foreground" />
            </Badge>
            <Badge onClick={handlePredefinedQuestion} className="cursor-pointer bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-foreground/10" variant="secondary">
              <User size={14} strokeWidth={2} className="text-muted-foreground mr-2" />

              <p className="text-sm px-1 py-0.5 font-medium text-muted-foreground">
                Am I a good fit?
              </p>
            </Badge>
            <Badge onClick={handleBadgeClick} className="cursor-pointer bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-foreground/10" variant="secondary">
              <Briefcase size={14} strokeWidth={2} className="text-muted-foreground mr-2" />

              <p className="text-sm px-1 py-0.5 font-semibold text-muted-foreground">
                What should I say in my cover letter?
              </p>
            </Badge>

          </div>

          {showAlert && <AlertDemo />}
        </>
      )}
      <div className="prose-td code:display-inline-block prose-td code:bg-gray-200 prose-td code:px-2 prose-td code:py-1 prose-td code:rounded-md prose prose-headings:mb-[0.7em] prose-headings:mt-[1.25em] prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-[32px] prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-p:mb-4 prose-p:mt-0 prose-p:leading-relaxed prose-p:before:hidden prose-p:after:hidden prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-neutral-500 prose-blockquote:before:hidden prose-blockquote:after:hidden prose-code:my-0 prose-code:inline-block prose-code:rounded-md prose-code:bg-neutral-100 prose-code:px-2 prose-code:text-[85%] prose-code:font-normal prose-code:leading-relaxed prose-code:text-primary prose-code:before:hidden prose-code:after:hidden prose-pre:mb-4 prose-pre:mt-0 prose-pre:whitespace-pre-wrap prose-pre:rounded-lg prose-pre:bg-neutral-100 prose-pre:px-3 prose-pre:py-3 prose-pre:text-base prose-pre:text-primary prose-ol:mb-4 prose-ol:mt-1 prose-ol:pl-8 marker:prose-ol:text-primary prose-ul:mb-4 prose-ul:mt-1 prose-ul:pl-8 marker:prose-ul:text-primary prose-li:mb-0 prose-li:mt-0.5 prose-li:text-primary first:prose-li:mt-0 prose-table:w-full prose-table:table-auto prose-table:border-collapse prose-th:break-words prose-th:text-center prose-th:font-semibold prose-td:break-words prose-td:px-4 prose-td:py-2 prose-td:text-left prose-img:mx-auto prose-img:my-12 prose-video:my-12 max-w-none overflow-auto text-primary">
        <Accordion type="single" className="w-full" defaultValue="item-description">
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
      <Suspense fallback={<div>Loading similar jobs...</div>}>
        <SimilarJobs jobTitle={jobPosting.title} experienceLevel={jobPosting.experienceLevel ?? ""} />
      </Suspense>

      <Suspense fallback={<div>Loading similar jobs...</div>}>
        <CompanySimilarJobs company={jobPosting.company} />
      </Suspense>
    </div>
  );
}

function ReportPopover() {
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