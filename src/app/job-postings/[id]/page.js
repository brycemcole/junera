'use client';
require('dotenv').config(); // Ensure you have dotenv installed and configured
import { useEffect, useState, Suspense, useCallback } from 'react';
import { React, use } from 'react';
import { formatDistanceToNow, set } from "date-fns";
import AlertDemo from "./AlertDemo";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';
import OpenAI from "openai";
import { JobList } from "@/components/JobPostings";


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
import { Blocks, Bolt, BookOpen, Box, ChevronDown, CircleAlert, CopyPlus, Ellipsis, Files, House, Layers2, Loader2, Loader2Icon, PanelsTopLeft } from "lucide-react";
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
  const allowedTags = ['b', 'i', 'strong', 'em', 'p', 'ul', 'li', 'ol', 'h1', 'u'];
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
  const [error, setError] = useState(null);

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
    <JobList data={similarJobs} loading={loading} error={error} />
  );
};

const CompanySimilarJobs = ({ company }) => {
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <JobList data={similarJobs} loading={loading} error={error} />

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


function Summarization({ title, message, loading, error }) {
  return (
    <div className="rounded-lg shadow-sm border border-blue-700/20 bg-blue-500/20 px-4 py-3 mb-4">
      <div className="flex gap-3">
        <div className="grow space-y-1">
          <p className="text-sm text-blue-600 font-medium dark:text-blue-400">{title}</p>
          <p className="list-inside list-disc text-sm text-blue-500 dark:text-blue-300">
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input26 } from '@/components/input26';




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
    setLlmResponse(""); // Initialize as empty string for streaming
    setLoadingLLMResponse(true);
    let fullResponse = ""; // Track complete response

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          jobPosting,
          jobId: id
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.content;
              if (content) {
                fullResponse += content;
                setLlmResponse(prev => prev + content);
              }
            } catch (err) {
              console.error('Error parsing chunk:', err);
            }
          }
        }
      }

      // After streaming is complete, update UI
      if (fullResponse) {
        // Save summary to database
        try {
          const response = await fetch('/api/job-postings', {
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

          if (!response.ok) {
            throw new Error('Failed to save summary');
          }

          toast({
            title: "Summary generated",
            description: "The job summary has been created successfully.",
            variant: "default"
          });
        } catch (error) {
          console.error('Error saving summary:', error);
          toast({
            title: "Error",
            description: "Failed to save the summary.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorLLMResponse(error.message);
      setLlmResponse("Failed to get a response. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate the summary.",
        variant: "destructive"
      });
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

  const handleSearch = useCallback(
    async (val) => {
      if (val !== title) {
        setTitle(val);
        setCurrentPage(1);
        const params = {
          title: val,
          explevel: experienceLevel,
          location,
          company,
          strict: strictSearch,
          applyJobPrefs: applyJobPrefs.toString(),
          page: '1'
        };
        const newParams = new URLSearchParams(params);
        const newUrl = `/job-postings?${newParams.toString()}`;
        if (newUrl !== router.asPath) {
          await router.push(newUrl);
        }
      }
    },
    []
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data.success) return <div>Job posting not found.</div>;

  const jobPosting = data.data;
  const companyJobCount = data.jobPostingsCount;

  const { keywords, relatedPostings } = data;

  return (
    <>
      <title>{`junera ${jobPosting.title ? `| ${jobPosting.title}` : ''} ${jobPosting.location ? `in ${jobPosting.location}` : ''} ${jobPosting.company ? `at ${jobPosting.company}` : ''} | jobs`}</title>
      <meta name="description" content={`Find ${jobPosting.title || ''} jobs ${jobPosting.location ? 'in ' + jobPosting.location : ''} ${jobPosting.company ? 'at ' + jobPosting.company : ''}. Browse through job listings and apply today!`} />
      <meta name="robots" content="index, follow" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`junera ${jobPosting.title ? `| ${jobPosting.title}` : ''} ${jobPosting.location ? `in ${jobPosting.location}` : ''} ${jobPosting.company ? `at ${jobPosting.company}` : ''} | jobs`} />
      <meta property="og:description" content={`Find ${jobPosting.title || ''} jobs ${jobPosting.location ? 'in ' + jobPosting.location : ''} ${jobPosting.company ? 'at ' + jobPosting.company : ''}. Browse through job listings and apply today!`} />
      <meta property="og:url" content={`https://junera.ai/job-postings/${id}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://junera.us/job-postings/${id}`
            },
            "title": jobPosting.title,
            "description": jobPosting.description,
            "datePosted": jobPosting.created_at,
            "validThrough": jobPosting.valid_through || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressRegion": jobPosting.location || "Multiple Locations"
              }
            },
            "hiringOrganization": {
              "@type": "Organization",
              "name": jobPosting.company
            },
            "employmentType": jobPosting.experienceLevel ? jobPosting.experienceLevel.toUpperCase() : "FULL_TIME",
            "baseSalary": jobPosting.salary_range_str ? {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": {
                "@type": "QuantitativeValue",
                "value": jobPosting.salary_range_str
              }
            } : undefined,
            "applicantLocationRequirements": jobPosting.location?.toLowerCase().includes('remote') ? {
              "@type": "Country",
              "name": "Remote"
            } : undefined
          }, null, 2),
        }}
      />
      <div className="container mx-auto py-0 px-4 sm:px-6 lg:px-0 max-w-4xl">
        <div>
          <h3 className="text-md font-semibold text-muted-foreground hover:text-foreground hover-offset-4">

            <Link className="flex flex-row items-center gap-4" href={`/job-postings?company=${jobPosting.company}`}>
              <Avatar alt={jobPosting.company} className="w-8 h-8 rounded-full">
                <AvatarImage src={`https://logo.clearbit.com/${jobPosting.company}.com`} />
                <AvatarFallback>{jobPosting.company?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-md text-foreground truncate">{jobPosting.company}</p>
                <div className="text-xs text-muted-foreground">
                  {companyJobCount === 1 ? "1 job posting" : `${companyJobCount} job postings`}
                </div>
              </div>
            </Link>
          </h3>
        </div>
        <h1 data-scroll-title className="text-2xl mb-0 font-semibold decoration-2 leading-normal min-w-0">{jobPosting.title}</h1>
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
        <div className="mb-4 flex flex-wrap gap-2 gap-y-1 text-md font-medium text-muted-foreground items-start">
          {jobPosting?.salary ? (
            <div className="flex items-center gap-2">
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
          {/*
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
          */}
          <div className="flex items-center gap-2">
            <span className={`${jobPosting.location.toLowerCase().includes('remote')
              ? 'text-green-500 dark:text-green-600'
              : ''
              }`}>
              {jobPosting.location.toLowerCase().includes('remote')
                ? jobPosting.location
                : `in ${jobPosting.location}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>posted {formatDistanceToNow(jobPosting.created_at, { addSuffix: true })}</span>
          </div>

          {jobPosting?.experienceLevel && (
            <>
              <div className="flex items-center gap-2">
                <span>{jobPosting.experienceLevel}</span>
              </div>

            </>
          )}
        </div>

        <div className="flex flex-wrap flex-col gap-4 gap-y-3 mt-4 mb-4">
          <div className="flex gap-2">
            <Link
              href={`${jobPosting.source_url}`}
              target="_blank"
              onClick={handleApplyClick} // Add onClick handler
            >
              <Button className="group md:w-auto text-green-600 bg-green-500/10 border border-green-600/20 hover:bg-green-500/20 hover:text-green-500">
                Apply
              </Button>
            </Link>
            <Button24 jobId={id} />
            <MagicButton />
            <JobDropdown handleSummarizationQuery={handleSummarizationQuery} />
          </div>


        </div>
        {(jobPosting.summary || loadingLLMReponse || llmResponse) && (
          <Summarization
            title="Summary"
            message={llmResponse || jobPosting.summary}
            loading={loadingLLMReponse}
            error={errorLLMResponse}
          />
        )}
        <div className="prose-td code:display-inline-block prose-td code:bg-gray-200 prose-td code:px-2 prose-td code:py-1 prose-td code:rounded-md prose prose-headings:mb-[0.7em] prose-headings:mt-[1.25em] prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-[32px] prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-p:mb-4 prose-p:mt-0 prose-p:leading-relaxed prose-p:before:hidden prose-p:after:hidden prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-neutral-500 prose-blockquote:before:hidden prose-blockquote:after:hidden prose-code:my-0 prose-code:inline-block prose-code:rounded-md prose-code:bg-neutral-100 prose-code:px-2 prose-code:text-[85%] prose-code:font-normal prose-code:leading-relaxed prose-code:text-primary prose-code:before:hidden prose-code:after:hidden prose-pre:mb-4 prose-pre:mt-0 prose-pre:whitespace-pre-wrap prose-pre:rounded-lg prose-pre:bg-neutral-100 prose-pre:px-3 prose-pre:py-3 prose-pre:text-base prose-pre:text-primary prose-ol:mb-4 prose-ol:mt-1 prose-ol:pl-8 marker:prose-ol:text-primary prose-ul:mb-4 prose-ul:mt-1 prose-ul:pl-8 marker:prose-ul:text-primary prose-li:mb-0 prose-li:mt-0.5 prose-li:text-primary first:prose-li:mt-0 prose-table:w-full prose-table:table-auto prose-table:border-collapse prose-th:break-words prose-th:text-center prose-th:font-semibold prose-td:break-words prose-td:px-4 prose-td:py-2 prose-td:text-left prose-img:mx-auto prose-img:my-12 prose-video:my-12 max-w-none overflow-auto text-primary">

          <div type="single" className="w-full" defaultValue="item-description">
            {[
              { key: 'description', label: 'Job Description' }

            ].map(({ key, label }) => (
              <div key={key}>
                <p className="leading-loose text-sm">
                  <div
                    className="space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(stripHTML(decodeHTMLEntities(jobPosting[key]))),
                    }}
                  />

                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col space-y-2 mb-4">
          <Link href={`/job-postings?explevel=${encodeURIComponent(jobPosting.experienceLevel)}&title=${encodeURIComponent(jobPosting.title)}&location=${encodeURIComponent(jobPosting.location)}&strictSearch=false`}>
            <Button variant="link" size="sm" className="text-sm underline px-0">
              See more similar jobs
            </Button>
          </Link>

        </div>
        <Suspense fallback={<div>Loading similar jobs...</div>}>
          <p className="text-md font-semibold mb-3">Similar Jobs</p>
          <SimilarJobs jobTitle={jobPosting.title} experienceLevel={jobPosting.experienceLevel ?? ""} />
        </Suspense>

        <Suspense fallback={<div>Loading jobs at {jobPosting.company}...</div>}>
          <p className="text-md font-semibold mb-3">More Jobs at {jobPosting.company}</p>
          <CompanySimilarJobs company={jobPosting.company} />
        </Suspense>


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

      </div>
    </>
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