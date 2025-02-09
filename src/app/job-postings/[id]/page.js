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
import OpenAI from "openai";
import { JobList } from "@/components/JobPostings";
import SharePopover from "@/components/share-popover";
import { TextShimmer } from '@/components/core/text-shimmer';
import ReportPopover from "@/components/report-popover";
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
import { decodeHTMLEntities, stripHTML, stateMap } from '@/lib/job-utils';

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


const Summarization = ({ title, message, loading, error }) => {
  return (

    <div className="flex gap-3 mb-4">
      <div className="grow space-y-1">
        <span className="flex flex-row gap-4 items-center">
          <Sparkles size={16} strokeWidth={2} className="text-foreground" />
          <h2 className="text-md text-foreground font-semibold">{title}</h2>
        </span>

        <p className="list-inside list-disc text-md leading-loose dark:text-neutral-300">
          {loading && !message ? <TextShimmer className='text-sm' duration={1}>Generating Summary</TextShimmer> : message || error}
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
        <Button variant="outline" className="ml-auto w-9 h-9" size="default">
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

const getStateFromLocation = (location) => {
  if (!location) return null;
  const lowercaseLocation = location.toLowerCase();
  
  // First check if it's already a state abbreviation
  const stateAbbr = Object.values(stateMap).find(abbr => 
    lowercaseLocation.includes(abbr.toLowerCase())
  );
  if (stateAbbr) return stateAbbr;

  // Then check for full state names
  for (const [stateName, abbr] of Object.entries(stateMap)) {
    if (lowercaseLocation.includes(stateName)) {
      return abbr;
    }
  }
  return null;
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
  const [errorLLMResponse, setErrorLLMResponse] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isViewed, setIsViewed] = useState(false);
  const [viewedAt, setViewedAt] = useState(null);


  const handleSummarizationQuery = async () => {
    if (!user) return;
    const jobPosting = data.data;
    setLlmResponse(""); // Initialize as empty string for streaming
    setLoadingLLMReponse(true);
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

    // Execute all main data fetching in parallel immediately
    const promises = [
      fetch(`/api/job-postings/${id}`, {
        headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
        signal: controller.signal
      }).then(res => res.json()),
      user ? fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${user.token}` },
        signal: controller.signal
      }).then(res => res.json()) : Promise.resolve(null),
      localStorage.getItem('token') ? fetch(`/api/job-postings/${id}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }).then(res => res.json()) : Promise.resolve(null)
    ];

    Promise.all(promises)
      .then(([jobResult, profile, viewData]) => {
        if (!isMounted) return;

        setData(jobResult);
        if (profile) setUserProfile(profile);
        if (viewData) {
          setIsViewed(true);
          setViewedAt(new Date(viewData.interaction.interaction_date));
        }
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
      <div className="container mx-auto py-0 p-6 max-w-3xl">
        
        <div className="bg-background rounded-lg mb-8">
          
          <div className="flex items-start justify-between gap-4 mb-5">
            
            <div className="flex-grow">
              
              <div className="flex items-center gap-4 mb-4">
              <Avatar alt={jobPosting.company} className="w-14 h-14 rounded-lg flex-shrink-0" onClick={() => redirect(`/companies/${jobPosting.company}`)}> {/* Larger Avatar */}
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
              <h1 className="text-2xl font-bold tracking-tight"> 
                {jobPosting.title}
              </h1>
              </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-md mb-4"> 
                {jobPosting.salary && (
                  <div className="flex items-center gap-1.5">
                    <HandCoins className="h-4 w-4" /> 
                    <span>{jobPosting.salary}</span>
                  </div>
                )}
                {isViewed && (
                  <div className="flex items-center text-blue-500 gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Viewed <span>{formatDistanceStrict(viewedAt, new Date())} ago</span>
                  </div>
                )}
                {jobPosting.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> 
                    <span>{jobPosting.location}</span>
                  </div>
                )}
                {jobPosting?.experiencelevel != 'null' && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>{jobPosting.experiencelevel}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Timer className="h-4 w-4" />
                  <span>{formatDistanceToNow(jobPosting?.created_at, { addSuffix: false })}</span>
                </div>
              </div>

              {/* Keywords */}
              {keywords && keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} className="text-md px-2" variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-2"> {/* Adjusted margin */}
            <Link
              href={jobPosting.source_url}
              target="_blank"
              onClick={handleApplyClick}
              className="flex-1 sm:flex-none"
            >
              <Button className="w-full sm:w-auto min-w-28 text-blue-600 bg-blue-500/10 border border-blue-600/20 hover:bg-blue-500/20 hover:text-blue-500">
                Apply
              </Button>
            </Link>
            <Button24 jobId={id} />
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

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href={`/job-postings?title=${encodeURIComponent(jobPosting.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&strictSearch=false`}>
              <Button variant="secondary" size="sm" className="text-sm">
                <Telescope className="w-4 h-4 mr-2" />
                Similar Titles
              </Button>
            </Link>
            {jobPosting.location && (
              <>
                <Link href={`/job-postings?location=${encodeURIComponent(jobPosting.location)}`}>
                  <Button variant="secondary" size="sm" className="text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Jobs in {jobPosting.location}
                  </Button>
                </Link>
                {getStateFromLocation(jobPosting.location) && (
                  <Link href={`/job-postings?location=${encodeURIComponent(getStateFromLocation(jobPosting.location))}`}>
                    <Button variant="secondary" size="sm" className="text-sm">
                      <House className="w-4 h-4 mr-2" />
                      All {getStateFromLocation(jobPosting.location)} Jobs
                    </Button>
                  </Link>
                )}
                <Link 
                  href={`/job-postings?title=${encodeURIComponent(jobPosting.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&location=${encodeURIComponent(jobPosting.location)}&strictSearch=false`}
                >
                  <Button variant="secondary" size="sm" className="text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Similar Jobs Here
                  </Button>
                </Link>
              </>
            )}
            {jobPosting.experiencelevel && jobPosting.experiencelevel !== 'null' && (
              <Link href={`/job-postings?experienceLevel=${encodeURIComponent(jobPosting.experiencelevel)}`}>
                <Button variant="secondary" size="sm" className="text-sm">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {jobPosting.experiencelevel} Jobs
                </Button>
              </Link>
            )}
            {jobPosting.company && (
              <Link href={`/companies/${encodeURIComponent(jobPosting.company)}`}>
                <Button variant="secondary" size="sm" className="text-sm">
                  <Building2 className="w-4 h-4 mr-2" />
                  More at {jobPosting.company}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Rest of the content */}
        {(jobPosting.summary || loadingLLMReponse || llmResponse) && (
          <Summarization
            title="Summary"
            message={llmResponse || jobPosting.summary}
            loading={loadingLLMReponse}
            error={errorLLMResponse}
          />
        )}
        <div>

          {!user && !loading && (
            <div className="rounded-lg border border-green-600/30 bg-green-500/20 px-4 py-3 mb-6">
              <p className="text-sm leading-relaxed">
                <BookmarkIcon
                  className="-mt-0.5 me-3 inline-flex text-green-500"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Login to save job postings and get notified when more jobs like this are posted. <Link href="/login" className="text-green-600 hover:underline">
                  Login here.
                </Link>
              </p>
            </div>
          )}
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
        <div className="flex flex-col space-y-2 mb-4">
          <Link href={`/job-postings?explevel=${encodeURIComponent(jobPosting.experienceLevel)}&title=${encodeURIComponent(jobPosting.title)}&location=${encodeURIComponent(jobPosting.location)}&strictSearch=false`}>
            <Button variant="link" size="sm" className="text-sm underline px-0">
              See more similar jobs
            </Button>
          </Link>

        </div>
        <Suspense fallback={<div>Loading similar jobs...</div>}>
          <span className="flex flex-row mb-2 gap-4 items-center">
            <Telescope size={16} strokeWidth={2} className="text-foreground" />
            <h2 className="text-md font-semibold text-foreground">Similar Jobs</h2>
          </span>
          <SimilarJobs jobTitle={jobPosting.title} experienceLevel={jobPosting.experienceLevel ?? ""} />
        </Suspense>

        <Suspense fallback={<div>Loading jobs at {jobPosting.company}...</div>}>
          <span className="flex flex-row mb-2 gap-4 items-center">
            <Telescope size={16} strokeWidth={2} className="text-foreground" />
            <h2 className="text-md font-semibold text-foreground">More Jobs at {jobPosting.company}</h2>
          </span>

          <CompanySimilarJobs company={jobPosting.company} />
        </Suspense>

      </div>
    </>
  );
}