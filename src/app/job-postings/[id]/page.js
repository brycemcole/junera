'use client';
require('dotenv').config();
import { useEffect, useState, Suspense, useCallback } from 'react';
import { React, use } from 'react';
import { formatDistanceToNow, set, format, formatDistanceStrict } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import AlertDemo from "./AlertDemo";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';
import ViewStatusIndicator from '@/components/view-status-indicator';
import OpenAI from "openai";
import { JobList } from "@/components/JobPostings";
import SharePopover from "@/components/share-popover";
import { TextShimmer } from '@/components/core/text-shimmer';
import ReportPopover from "@/components/report-popover";
import { TextEffect } from '@/components/ui/text-effect';
import ReactMarkdown from 'react-markdown';

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
import BookmarkButton from "@/components/bookmark-button"
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
import { Blocks, Bolt, BookmarkIcon, BookOpen, Box, BriefcaseBusiness, Building2, ChevronDown, CircleAlert, CopyPlus, Ellipsis, Files, House, InfoIcon, Layers2, Loader2, Loader2Icon, MapIcon, PanelsTopLeft, Tag, Telescope, Text, Eye, HandCoins } from "lucide-react";
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
import { redirect } from 'next/navigation';
import { decodeHTMLEntities, stripHTML, stateMap, getStateFromLocation, getFullStateFromLocation } from '@/lib/job-utils';

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

// Update Summarization component to handle error properly
const Summarization = ({ title, message, loading, error }) => {
  return (
    <div className="flex gap-3 mb-4">
      <div className="grow space-y-1">
        <span className="flex flex-row gap-4 items-center">
          <Sparkles size={16} strokeWidth={2} className="text-foreground" />
          <h2 className="text-md text-foreground font-semibold">{title}</h2>
        </span>

        <div className="list-inside list-disc text-md leading-loose dark:text-neutral-300">
          {loading && !message ? (
            <TextShimmer className='text-sm' duration={1}>Generating Summary</TextShimmer>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <TextEffect
              per='line'
              as='p'
              segmentWrapperClassName='overflow-hidden block'
              variants={{
                container: {
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2 },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 40,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.4,
                    },
                  },
                },
              }}
            >
              {message}
            </TextEffect>
          )}
        </div>
        <div className="mt-0">
          <small className="text-xs text-gray-500">
            This content was generated by an AI system.
          </small>
        </div>
      </div>
    </div>
  );
}

const JobDropdown = ({ handleSummarizationQuery, jobId, title, company, companyLogo, location }) => {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const { user, loading } = useAuth();

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
        <Button variant="outline" className="w-9 h-9" size="default">
          <Ellipsis
            className="text-foreground"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-6 mt-2">
        {company && (
          <DropdownMenuItem onClick={() => redirect(`/companies/${company}`)}>
            <Building2 size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            {company}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <CopyPlus size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
          Copy Link
        </DropdownMenuItem>
        {user && !loading && (
          <DropdownMenuItem onClick={handleSummarizationQuery}>
            <Sparkles size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
            Generate Summary
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// New Components
const JobHeader = ({ jobPosting, companyJobCount, id, handleApplyClick, handleSummarizationQuery, keywords }) => (
  <div className="bg-transparent rounded-lg mb-4">
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex-grow">
        <div className="flex items-center gap-4 mb-4">
          <Avatar alt={jobPosting.company} className="h-10 w-10 sm:w-14 sm:h-14 rounded-lg flex-shrink-0" onClick={() => redirect(`/companies/${jobPosting.company}`)}>
            <AvatarImage src={`https://logo.clearbit.com/${jobPosting.company}.com`} />
            <AvatarFallback className="rounded-lg">{jobPosting.company?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/companies/${jobPosting.company}`}
              className="text-md font-semibold text-foreground/80 hover:underline underline-offset-4"
            >
              {jobPosting.company}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight"> {/* Increased font size */}
              {jobPosting.title}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-md mb-4">
          {jobPosting.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {/* Removed text-green-500 */}
              <span>{jobPosting.location}</span>
            </div>
          )}
          {jobPosting?.experiencelevel != 'null' && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {/* Removed text-green-500 */}
              <span>{jobPosting.experiencelevel}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" /> {/* Removed text-green-500 */}
            <span>{formatDistanceToNow(jobPosting?.created_at, { addSuffix: false })}</span>
          </div>
        </div>

        {/* Keywords */}
        {keywords && keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {keywords.map((keyword, index) => (
              <Link key={index} href={`/job-postings?keywords=${encodeURIComponent(keyword)}`}>
                <Badge className="text-sm text-green-800 border-green-600/20 bg-green-600/10 px-2 hover:bg-green-600/20 hover:border-green-600/30 transition-colors" variant="outline">
                  {keyword}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const JobActions = ({ jobPosting, id, handleApplyClick, handleSummarizationQuery }) => {
  return (
    <div className="flex flex-wrap items-left gap-2 mt-4 mb-8"> {/* Added margin bottom */}
      <Link
        href={jobPosting.source_url}
        target="_blank"
        onClick={handleApplyClick}
        className="flex-1 sm:flex-none"
      >
        <Button className="w-full sm:w-auto min-w-28 text-green-600 bg-green-500/10 border border-green-600/20 hover:bg-green-500/20 hover:text-green-500">
          Apply
        </Button>
      </Link>
      <BookmarkButton jobId={id} />
      <ReportPopover jobId={id} />
      <JobDropdown
        handleSummarizationQuery={handleSummarizationQuery}
        jobId={id}
        title={jobPosting.title}
        company={jobPosting.company}
        companyLogo={`https://logo.clearbit.com/${jobPosting.company}.com`}
        location={jobPosting.location}
      />
    </div>
  );
};

const JobFilters = ({ jobPosting }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4 mb-8"> {/* Added margin bottom */}
      <Link href={`/job-postings?title=${encodeURIComponent(jobPosting.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&strictSearch=false`}>
        <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10"> {/* Removed text-green-500 */}
          <Telescope className="w-4 h-4 mr-2" /> {/* Removed text-green-500 */}
          Similar Titles
        </Button>
      </Link>
      {jobPosting.location && (
        <>
          <Link href={`/job-postings?location=${encodeURIComponent(getFullStateFromLocation(jobPosting.location))}`}>
            <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10"> {/* Removed text-green-500 */}
              <MapPin className="w-4 h-4 mr-2" /> {/* Removed text-green-500 */}
              Jobs in {getFullStateFromLocation(jobPosting.location)}
            </Button>
          </Link>
          <Link
            href={`/job-postings?title=${encodeURIComponent(jobPosting.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&location=${encodeURIComponent(getFullStateFromLocation(jobPosting.location))}&strictSearch=false`}
          >
            <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10"> {/* Removed text-green-500 */}
              <MapPin className="w-4 h-4 mr-2" /> {/* Removed text-green-500 */}
              Similar Jobs Here
            </Button>
          </Link>
        </>
      )}
      {jobPosting.experiencelevel && jobPosting.experiencelevel !== 'null' && (
        <Link href={`/job-postings?experienceLevel=${encodeURIComponent(jobPosting.experiencelevel)}`}>
          <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10"> {/* Removed text-green-500 */}
            <Briefcase className="w-4 h-4 mr-2" /> {/* Removed text-green-500 */}
            {jobPosting.experiencelevel} Jobs
          </Button>
        </Link>
      )}
      {jobPosting.company && (
        <Link href={`/companies/${encodeURIComponent(jobPosting.company)}`}>
          <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10"> {/* Removed text-green-500 */}
            <Building2 className="w-4 h-4 mr-2" /> {/* Removed text-green-500 */}
            More at {jobPosting.company}
          </Button>
        </Link>
      )}
    </div>
  );
};

const JobSummary = ({ jobPosting, loadingLLMReponse, llmResponse, error }) => (
  (jobPosting.summary || loadingLLMReponse || llmResponse) && (
    <div className="mb-8"> {/* Added margin bottom */}
      <Summarization
        title="Summary"
        message={llmResponse || jobPosting.summary}
        loading={loadingLLMReponse}
        error={error}
      />
    </div>
  )
);

const JobDescription = ({ jobPosting, user, loading }) => (
  <div className="mt-8"> {/* Added margin top */}
    <div type="single" className="w-full" defaultValue="item-description">
      {[
        { key: 'description', label: 'Job Description' }

      ].map(({ key, label }) => (
        <div key={key}>
          <span className="flex flex-row mb-2 gap-4 items-center">
            <h2 className="text-md font-semibold text-foreground">{label}</h2>
          </span>
          <p className="leading-loose text-md break-words text-foreground dark:text-neutral-300">
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
);

const SimilarJobsSection = ({ jobPosting }) => (
  <Suspense fallback={<div>Loading similar jobs...</div>}>
    <span className="flex flex-row mb-2 gap-4 items-center">
      <Telescope size={16} strokeWidth={2} className="text-foreground" />
      <h2 className="text-md font-semibold text-foreground">Similar Jobs</h2>
    </span>
    <SimilarJobs jobTitle={jobPosting.title} experienceLevel={jobPosting.experienceLevel ?? ""} />
  </Suspense>
);

const CompanyJobsSection = ({ jobPosting }) => (
  <Suspense fallback={<div>Loading jobs at {jobPosting.company}...</div>}>
    <span className="flex flex-row mb-2 gap-4 items-center">
      <Telescope size={16} strokeWidth={2} className="text-foreground" />
      <h2 className="text-md font-semibold text-foreground">More Jobs at {jobPosting.company}</h2>
    </span>

    <CompanySimilarJobs company={jobPosting.company} />
  </Suspense>
);

const MarkdownContent = ({ content }) => {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-2" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-green-500/50 pl-4 italic my-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const JobFitAnalysis = ({ jobPosting }) => {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false); // Changed from true to false since we load on demand
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/job-postings/${jobPosting.job_id}/analyze`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch existing analysis');
        }

        const data = await response.json();
        if (data.exists && data.data.response) {
          setAnalysis(data.data.response);
        }
      } catch (error) {
        console.error('Error checking existing analysis:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkExistingAnalysis();
  }, [user, jobPosting.job_id]);

  const handleAnalyze = async () => {
    if (!user) return;
    
    setAnalysis(""); // Clear any existing analysis
    setLoading(true);
    setError(null);
    let responseText = '';

    try {
      const response = await fetch(`/api/job-postings/${jobPosting.job_id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Stream complete, final response:', responseText); // Debug log
          break;
        }

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                responseText += content;
                setAnalysis(prev => prev + content);
              }
            } catch (err) {
              console.error('Error parsing chunk:', err);
            }
          }
        }
      }


    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
      setAnalysis(""); // Clear analysis on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-4">
        <span className="flex flex-row gap-4 items-center">
          <User size={16} strokeWidth={2} className="text-foreground" />
          <h2 className="text-md font-semibold text-foreground">Job Fit Analysis</h2>
        </span>
        {!analysis && !loading && (
          <Button
            onClick={handleAnalyze}
            disabled={loading || !user}
            className="text-green-600 bg-green-500/10 border border-green-600/20 hover:bg-green-500/20 hover:text-green-500"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Fit
              </>
            )}
          </Button>
        )}
      </div>
      
      {!user && (
        <div className="rounded-lg border border-green-600/30 bg-green-500/20 px-4 py-3 mb-4">
          <p className="text-sm leading-relaxed">
            <InfoIcon className="-mt-0.5 me-3 inline-flex text-green-500" size={16} strokeWidth={2} />
            Login to get a personalized analysis of your fit for this role.{' '}
            <Link href="/login" className="text-green-600 hover:underline">Login here.</Link>
          </p>
        </div>
      )}

      {loading && !analysis && (
        <TextShimmer className='text-sm' duration={1}>
          Analyzing your profile fit...
        </TextShimmer>
      )}

      {error && (
        <div className="text-red-500">Error: {error}</div>
      )}

      {analysis && analysis.trim() !== '' && (
        <div className="rounded-lg border border-green-600/20 bg-green-500/5 p-6">
          <div className="space-y-2 leading-loose text-md break-words text-foreground dark:text-neutral-300">
            {analysis}
          </div>
        </div>
      )}
    </div>
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
  const [loadingLLMReponse, setLoadingLLMReponse] = useState(false);
  const [llmError, setLlmError] = useState(null);  // Renamed from errorLLMResponse
  const [userProfile, setUserProfile] = useState(null);
  const [isViewed, setIsViewed] = useState(false);
  const [viewedAt, setViewedAt] = useState(null);


  const handleSummarizationQuery = async () => {
    if (!user) return;
    const jobPosting = data.data;
    setLlmResponse(""); // Initialize as empty string for streaming
    setLoadingLLMReponse(true);
    setLlmError(null); // Clear any previous errors
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
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
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
      setLlmError(error.message);
      setLlmResponse("");
      toast({
        title: "Error",
        description: "Failed to generate the summary.",
        variant: "destructive"
      });
    } finally {
      setLoadingLLMReponse(false);
    }
  };



  // Combined useEffect for fetching both job data and user profile
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // Split into separate effect for company job count
    async function fetchCompanyJobCount(companyName, signal) {
      try {
        const response = await fetch(`/api/companies/job-postings-count/${companyName}`, {
          signal: signal
        });
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

    async function updateViewStatus(token) {
      try {
        const response = await fetch(`/api/job-postings/${id}/view-status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const viewData = await response.json();
        if (isMounted) {
          setIsViewed(viewData.isViewed);
          if (viewData.viewedAt) {
            setViewedAt(new Date(viewData.viewedAt));
          }
        }
      } catch (error) {
        console.error('Error updating view status:', error);
      }
    }

    // Execute all main data fetching in parallel immediately
    const promises = [
      fetch(`/api/job-postings/${id}`, {
        headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
        signal: controller.signal
      }).then(res => res.json()),
      user ? fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${user.token}` },
        signal: controller.signal
      }).then(res => res.json()) : Promise.resolve(null)
    ];

    if (user?.token) {
      promises.push(updateViewStatus(user.token));
    } else {
      promises.push(
        fetch(`/api/job-postings/${id}/view-status`, {
          headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
          signal: controller.signal
        }).then(res => res.json())
      );
    }

    Promise.all(promises)
      .then(([jobResult, profile]) => {
        if (!isMounted) return;

        setData(jobResult);
        if (profile) setUserProfile(profile);
        setLoading(false);

        // Fetch company job count after we have the company name
        if (jobResult?.data?.company) {
          fetchCompanyJobCount(jobResult.data.company, controller.signal);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Error fetching data:', err);
          setError(err.message);
          setLoading(false);
        }
      });

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

  if (loading) return <div className="container mx-auto py-2 px-4 max-w-4xl">
    <div className="animate-pulse">
      <div className="flex flex-row items-center gap-4">
        <div className="h-16 bg-gray-200 dark:bg-gray-900 rounded-xl w-full mb-4"></div>
        <div className="h-14 w-14 bg-gray-200 dark:bg-gray-900 rounded-xl w-1/4 mb-4"></div>
      </div>
      <div className="h-6 bg-gray-200 dark:bg-gray-900 rounded-xl w-1/2 mb-4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-900 rounded-xl w-1/2 mb-4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-900 rounded-xl w-1/2 mb-4"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-72 bg-gray-200 dark:bg-gray-900 rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>;
  if (error) return <div>Error: {error}</div>;
  if (!data.success) return <div>Job posting not found.</div>;

  const jobPosting = data.data;
  const companyJobCount = data.jobPostingsCount;

  const { keywords, relatedPostings } = data;

  return (
    <>
      <div className="container mx-auto py-0 sm:pt-10 p-4 sm:p-6 max-w-4xl">
        {/* Add structured job data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": jobPosting.title,
              "description": stripHTML(decodeHTMLEntities(jobPosting.description)),
              "datePosted": jobPosting.created_at,
              "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              "employmentType": jobPosting.experienceLevel?.toUpperCase() || "FULL_TIME",
              "hiringOrganization": {
                "@type": "Organization",
                "name": jobPosting.company,
                "logo": jobPosting.company ? `https://logo.clearbit.com/${jobPosting.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null
              },
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressRegion": jobPosting.location
                }
              },
              "baseSalary": jobPosting.salary ? {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": {
                  "@type": "QuantitativeValue",
                  "value": jobPosting.salary
                }
              } : undefined
            })
          }}
        />
        <JobHeader
          jobPosting={jobPosting}
          companyJobCount={companyJobCount}
          id={id}
          handleApplyClick={handleApplyClick}
          handleSummarizationQuery={handleSummarizationQuery}
          keywords={keywords}
        />
        <JobActions
          jobPosting={jobPosting}
          id={id}
          handleApplyClick={handleApplyClick}
          handleSummarizationQuery={handleSummarizationQuery}
        />
        <JobFilters jobPosting={jobPosting} />
        <JobSummary
          jobPosting={jobPosting}
          loadingLLMReponse={loadingLLMReponse}
          llmResponse={llmResponse}
          error={llmError}  // Pass the renamed error state
        />
        <JobFitAnalysis jobPosting={jobPosting} />
        <JobDescription jobPosting={jobPosting} user={user} loading={loading} />
        <div className="flex flex-col space-y-2 mb-4">
          <Link href={`/job-postings?explevel=${encodeURIComponent(jobPosting.experienceLevel)}&title=${encodeURIComponent(jobPosting.title)}&location=${encodeURIComponent(jobPosting.location)}&strictSearch=false`}>
            <Button variant="link" size="sm" className="text-sm underline px-0">
              See more similar jobs
            </Button>
          </Link>

        </div>
        <SimilarJobsSection jobPosting={jobPosting} />
        <CompanyJobsSection jobPosting={jobPosting} />
      </div>
    </>
  );
}