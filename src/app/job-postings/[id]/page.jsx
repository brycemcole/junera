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
import { GlowEffect } from '@/components/ui/glow-effect';
import KeywordBadge from '@/components/keyword-badge';

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
import { Blocks, Bolt, BookmarkIcon, BookOpen, Box, BriefcaseBusiness, Building2, ChevronDown, CircleAlert, CopyPlus, Ellipsis, Files, House, InfoIcon, Layers2, Loader2, Loader2Icon, MapIcon, PanelsTopLeft, Tag, Telescope, Text, Eye, HandCoins, CheckCircleIcon, TimerIcon, ChevronLeft } from "lucide-react";
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
import { Pill, PillDelta, PillIndicator, PillStatus } from '@/components/pill';
import LoginCTA from '@/components/login-cta';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { MatchAnalysis } from '@/components/job-postings/match-analysis';

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

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );

  return (
    <div className="w-full overflow-x-hidden">
      <JobList data={similarJobs} loading={loading} error={error} />
    </div>
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

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );

  return (
    <div className="w-full overflow-x-hidden">
      <JobList data={similarJobs} loading={loading} error={error} />
    </div>
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

        <p className="list-inside list-disc text-md leading-loose dark:text-neutral-300">
          {loading ? (
            <TextShimmer className='text-sm' duration={1}>Generating Summary</TextShimmer>
          ) : error ? (
            error
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message}</span>
          )}
        </p>
        <div className="mt-0">
          <small className="text-xs text-gray-500">
            This content was generated by an AI system.
          </small>
        </div>
      </div>
    </div>
  );
}

const JobDropdown = ({ handleSummarizationQuery, handleAnalyzeJob, jobId, title, company, companyLogo, location }) => {
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
          <>
            <DropdownMenuItem onClick={handleSummarizationQuery}>
              <Sparkles size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
              Generate Summary
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAnalyzeJob}>
              <Wand2 size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
              Regenerate Analysis
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// New Components
const JobHeader = ({ 
  jobPosting, 
  companyJobCount, 
  id, 
  handleApplyClick, 
  handleSummarizationQuery,
  handleAnalyzeJob,  // Add this prop
  keywords, 
  isViewed, 
  agentNote, 
  showFullAnalysis, 
  setShowFullAnalysis 
}) => {
  const getMatchScoreColor = (score) => {
    if (!score) return 'text-muted-foreground';
    
    switch (score.toLowerCase()) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Search Results Pagination */}
      <div className="flex items-center">
        <div className="flex-1">
          <Link href="/job-postings">
            <Button variant="link" className="px-0 flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back to search results
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3"> {/* Changed from items-center to items-start */}
          <div className="space-y-1 flex-1"> {/* Added flex-1 */}
            <Link
              href={`/companies/${jobPosting.company}`}
              className="text-sm flex flex-row items-center gap-2 font-medium hover:underline"
            >
                        <Avatar className="h-6 w-6 rounded-lg" onClick={() => redirect(`/companies/${jobPosting.company}`)}>
            <AvatarImage src={`https://logo.clearbit.com/${jobPosting.company}.com`} />
            <AvatarFallback className="rounded-lg bg-muted">{jobPosting.company?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
              {jobPosting.company}
            </Link>
            <div className="flex flex-wrap items-center gap-2"> {/* Changed flex container */}
              <h1 className="text-2xl font-semibold tracking-tight">
                {jobPosting.title}
              </h1>
              {agentNote && agentNote.match_score?.toLowerCase() === 'high' && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-600/20 whitespace-nowrap">
                  <Sparkles className="h-3 w-3 mr-1" />
                  High Match
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Job Details - Only render this div if at least one detail is available */}
        {(jobPosting.location || 
         (jobPosting?.experiencelevel && jobPosting.experiencelevel !== 'null') || 
         jobPosting?.created_at || 
         isViewed) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
            {jobPosting.location && (
              <div>
                <h5 className="text-sm font-medium mb-1">Location</h5>
                <p className="text-muted-foreground">{jobPosting.location}</p>
              </div>
            )}
            
            {jobPosting?.experiencelevel && jobPosting.experiencelevel !== 'null' && (
              <div>
                <h5 className="text-sm font-medium mb-1">Experience Level</h5>
                <p className="text-muted-foreground">{jobPosting.experiencelevel}</p>
              </div>
            )}
            
            {jobPosting?.created_at && (
              <div>
                <h5 className="text-sm font-medium mb-1">Posted</h5>
                <p className="text-muted-foreground">{formatDistanceToNow(jobPosting.created_at)} ago</p>
              </div>
            )}
            
            {isViewed && (
              <div>
                <h5 className="text-sm font-medium mb-1">Status</h5>
                <p className="text-muted-foreground">Viewed</p>
              </div>
            )}
                    {keywords && keywords.length > 0 && (
                      <div>
                      <h5 className="text-sm font-medium mb-1">Keywords</h5>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {keywords.slice(0, 5).map((keyword, index) => (
                          <KeywordBadge 
                            key={index}
                            keyword={keyword}
                            clickable={true}
                            colorScheme="blue"
                          />
                        ))}
                        {keywords.length > 5 && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5">
                            +{keywords.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                    )}
          </div>
        )}
        </div>
        

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={jobPosting.source_url}
            target="_blank"
            onClick={handleApplyClick}
          >
            <Button 
              className="gap-2 bg-green-500/10 text-green-600 border-green-600/20 hover:bg-green-500/20"
              variant="outline"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <BookmarkButton jobId={id} />
          <ReportPopover jobId={id} />
          <JobDropdown
            handleSummarizationQuery={handleSummarizationQuery}
            handleAnalyzeJob={handleAnalyzeJob}
            jobId={id}
            title={jobPosting.title}
            company={jobPosting.company}
            companyLogo={`https://logo.clearbit.com/${jobPosting.company}.com`}
            location={jobPosting.location}
          />
        </div>

                {/* Agent Note Section */}
                {agentNote && (
  <MatchAnalysis 
    agentNote={agentNote}
    showFullAnalysis={showFullAnalysis}
    onToggleAnalysis={() => setShowFullAnalysis(!showFullAnalysis)}
  />
)}

      </div>
  );
};

const JobSummary = ({ jobPosting, loadingLLMReponse, llmResponse, error }) => {
  // Don't render anything if there's no summary and we're not loading
  if (!loadingLLMReponse && !llmResponse && !jobPosting.summary) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Summary</h2>
        </div>
        
        {loadingLLMReponse ? (
          <div className="space-y-2">
            <TextShimmer className="text-sm h-4 w-full">Generating summary...</TextShimmer>
            <TextShimmer className="text-sm h-4 w-3/4">Please wait...</TextShimmer>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm leading-relaxed text-foreground">
              {llmResponse || jobPosting.summary}
            </div>
            <div className="text-xs text-muted-foreground">
              This content was generated by AI
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const JobDescription = ({ jobPosting }) => (
  <div className="rounded-lg border bg-card">
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Text className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Job Description</h2>
      </div>
      <div 
        className="text-sm leading-relaxed text-foreground space-y-4 [&_a]:break-words [&_a]:inline-block [&_a]:max-w-full"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            stripHTML(decodeHTMLEntities(jobPosting.description))
          ),
        }}
      />
    </div>
  </div>
);

const SimilarJobsSection = ({ jobPosting }) => (
  <div className="rounded-lg border bg-card">
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Telescope size={16} className="text-primary" />
        <h2 className="text-base font-semibold">Similar Jobs</h2>
      </div>
      <div className="w-full overflow-x-hidden">
        <Suspense fallback={
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        }>
          <SimilarJobs jobTitle={jobPosting.title} experienceLevel={jobPosting.experienceLevel ?? ""} />
        </Suspense>
      </div>
    </div>
  </div>
);

const CompanyJobsSection = ({ jobPosting }) => (
  <div className="rounded-lg border bg-card">
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={16} className="text-primary" />
        <h2 className="text-base font-semibold">More at {jobPosting.company}</h2>
      </div>
      <div className="w-full overflow-x-hidden">
        <Suspense fallback={
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        }>
          <CompanySimilarJobs company={jobPosting.company} />
        </Suspense>
      </div>
    </div>
  </div>
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
  const [analysis, setAnalysis] = useState({ worthy_apply: null, explanation: "" });
  const [loading, setLoading] = useState(false);
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
          try {
            const parsedResponse = JSON.parse(data.data.response);
            setAnalysis(parsedResponse);
          } catch (err) {
            console.error('Error parsing response:', err);
            setAnalysis({ worthy_apply: null, explanation: data.data.response });
          }
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
    
    setAnalysis({ worthy_apply: null, explanation: "" });
    setLoading(true);
    setError(null);

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
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                fullResponse += parsed.content;
                try {
                  // Try to parse as JSON as we receive chunks
                  const parsedResponse = JSON.parse(fullResponse);
                  setAnalysis(parsedResponse);
                } catch {
                  // If it's not valid JSON yet, just accumulate the content
                  setAnalysis(prev => ({ ...prev, explanation: fullResponse }));
                }
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
      setAnalysis({ worthy_apply: null, explanation: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!analysis.explanation && !loading && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-base font-semibold">Job Fit Analysis</span>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={loading || !user}
            variant="outline"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Fit
              </>
            )}
          </Button>
        </div>
      )}

      {!user && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-primary" />
            <span className="text-foreground">
              <Link href="/login" className="font-medium hover:underline">Log in</Link>
              {" "}to unlock a personalized job fit analysis based on your profile.
            </span>
          </p>
        </div>
      )}

      {loading && !analysis.explanation && (
        <div className="p-4">
          <TextShimmer className="text-sm">Analyzing your profile fit...</TextShimmer>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {analysis.explanation && analysis.explanation.trim() !== '' && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {analysis.worthy_apply !== null && (
            <Badge variant="outline" className={
              analysis.worthy_apply
                ? 'border-green-600/20 bg-green-500/10 text-green-600'
                : 'border-yellow-600/20 bg-yellow-500/10 text-yellow-600'
            }>
              {analysis.worthy_apply ? 'Recommended to Apply' : 'Consider Requirements'}
            </Badge>
          )}
          <div className="text-sm leading-relaxed text-foreground">
            {analysis.explanation}
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
  const [agentNote, setAgentNote] = useState(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [insightsShown, setInsightsShown] = useState(false);
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [llmResponse, setLlmResponse] = useState("");
  const [loadingLLMReponse, setLoadingLLMReponse] = useState(false);
  const [llmError, setLlmError] = useState(null);  // Renamed from errorLLMResponse
  const [userProfile, setUserProfile] = useState(null);
  const [isViewed, setIsViewed] = useState(false);
  const [viewedAt, setViewedAt] = useState(null);

  // Add a new function to handle view status update
  const updateViewStatus = async () => {
    if (!user) return;
    
    try {
      await fetch(`/api/job-postings/${id}/view-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        }
      });

      const event = new CustomEvent('jobViewed', {
        detail: { jobId: id, isViewed: true }
      });
      window.dispatchEvent(event);
      setIsViewed(true);
    } catch (error) {
      console.error('Error updating view status:', error);
    }
  };

  const handleSummarizationQuery = async () => {
    if (!user) return;
    const jobPosting = data.data;

    setLlmResponse("");
    setLoadingLLMReponse(true);
    setLlmError(null);

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
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                fullResponse += parsed.content;
                setLlmResponse(prev => prev + parsed.content);
              }
            } catch (err) {
              console.error('Error parsing chunk:', err);
            }
          }
        }
      }

      // Save the complete summary
      if (fullResponse) {
        try {
          const saveResponse = await fetch('/api/job-postings', {
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

          if (!saveResponse.ok) {
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
      setLlmResponse("Failed to get a response. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate the summary.",
        variant: "destructive"
      });
    } finally {
      setLoadingLLMReponse(false);
    }
  };

  // Add the fetchAgentNote function
  const fetchAgentNote = async () => {
    if (!user || !id) return;
    try {
      const response = await fetch(`/api/agent-notes/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAgentNote(data.data);
      }
    } catch (error) {
      console.error('Error fetching agent note:', error);
    }
  };

  // Combined useEffect for fetching both job data and user profile
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // Immediately update view status when page loads
    if (user) {
      updateViewStatus();
    }

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

    // Add fetchAgentNote to the promises array if user exists
    if (user?.token) {
      fetchAgentNote();
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

  const handleAnalyzeJob = async () => {
    if (!user) return;
    
    const response = await fetch(`/api/job-postings/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
      }
    });

    if (!response.ok) {
      toast({
        title: "Error",
        description: "Failed to analyze job fit",
        variant: "destructive"
      });
      return;
    }

    // Reset any existing analysis state
    setAgentNote(null);

    // Read the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                fullResponse += parsed.content;
                try {
                  const parsedResponse = JSON.parse(fullResponse);
                  setAgentNote({
                    match_score: parsedResponse.worthy_apply ? 'High' : 'Low',
                    explanation: parsedResponse.explanation
                  });
                } catch {
                  // If not valid JSON yet, continue accumulating
                }
              }
            } catch (err) {
              console.error('Error parsing chunk:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      toast({
        title: "Error",
        description: "Failed to process analysis",
        variant: "destructive"
      });
    }
  };

  if (loading) return <div className="container mx-auto py-2 px-4 max-w-6xl">
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
      <div className="container mx-auto py-0 sm:py-6 px-4 max-w-4xl">
        <div className="space-y-6 md:space-y-8">
          <JobHeader
            jobPosting={jobPosting}
            companyJobCount={companyJobCount}
            id={id}
            handleApplyClick={handleApplyClick}
            handleSummarizationQuery={handleSummarizationQuery}
            handleAnalyzeJob={handleAnalyzeJob}  // Add this prop
            keywords={keywords}
            isViewed={isViewed}
            agentNote={agentNote}
            showFullAnalysis={showFullAnalysis}
            setShowFullAnalysis={setShowFullAnalysis}
          />
          
          {/* Show Job Fit Analysis for logged in users, or LoginCTA for non-logged in users */}
          {user ? (
            <>
              {(!agentNote || agentNote?.match_score?.toLowerCase() !== 'high') && (
                <div className="mt-6 md:mt-8">
                  <JobFitAnalysis jobPosting={jobPosting} />
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 md:mt-8">
              <LoginCTA 
                title="Unlock personalized job tools"
                description="Create an account to access premium job search features."
                features={[
                  "Personal job fit analysis based on your profile",
                  "Save jobs and track applications",
                  "AI-powered resume and job matching",
                  "Smart recruiter agent notifications",
                  "Job application tracking"
                ]}
              />
            </div>
          )}
          
          <JobSummary
            jobPosting={jobPosting}
            loadingLLMReponse={loadingLLMReponse}
            llmResponse={llmResponse}
            error={llmError}
          />
          
          <JobDescription jobPosting={jobPosting} />
          
          <div className="space-y-6 md:space-y-8 w-full max-w-[100vw] overflow-hidden">
            <SimilarJobsSection jobPosting={jobPosting} />
            <CompanyJobsSection jobPosting={jobPosting} />
          </div>
        </div>
      </div>
    </>
  );
}