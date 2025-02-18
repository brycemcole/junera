import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, X, MapPin, Briefcase, Timer, DollarSign, Building2, Telescope, Sparkles, User, InfoIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { stripHTML, decodeHTMLEntities, parseUSLocations, getFullStateFromLocation } from '@/lib/job-utils';
import BookmarkButton from './bookmark-button';
import ReportPopover from './report-popover';
import { TextShimmer } from './core/text-shimmer';
import { TextEffect } from './ui/text-effect';
import { JobList } from './JobPostings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';

// Component imports from the job posting page
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
      </div>
    </div>
  );
};

export default function JobPreviewModal({ jobId, onClose, isSidebar }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [llmResponse, setLlmResponse] = useState("");
  const [loadingLLMReponse, setLoadingLLMReponse] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/job-postings/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        const data = await response.json();
        setJob(data.data);
        
        // Track the view when the modal opens
        if (user) {
          await fetch('/api/job-postings/track-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
            body: JSON.stringify({ jobId }),
          });

          // Dispatch a custom event to notify other components about the view status change
          const event = new CustomEvent('jobViewed', { 
            detail: { jobId, isViewed: true } 
          });
          window.dispatchEvent(event);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId, user]);

  const handleApply = () => {
    if (job) {
      window.open(job.source_url, '_blank');
    }
  };

  const handleSummarizationQuery = async () => {
    if (!user) return;
    const jobPosting = job;
    setLlmResponse("");
    setLoadingLLMReponse(true);
    setLlmError(null);
    let fullResponse = "";

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          jobPosting,
          jobId
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
    } catch (error) {
      console.error("Error:", error);
      setLlmError(error.message);
      setLlmResponse("");
    } finally {
      setLoadingLLMReponse(false);
    }
  };

  const JobHeader = ({ job }) => (
    <div className="bg-transparent rounded-lg mb-4">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-grow">
          <div className="flex items-center gap-4 mb-4">
            <Avatar alt={job.company} className="h-10 w-10 sm:w-14 sm:h-14 rounded-lg flex-shrink-0">
              <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} />
              <AvatarFallback className="rounded-lg">{job.company?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/companies/${job.company}`}
                className="text-md font-semibold text-foreground/80 hover:underline underline-offset-4"
              >
                {job.company}
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">
                {job.title}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-md mb-4">
            {job.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job?.experiencelevel != 'null' && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>{job.experiencelevel}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" />
              <span>{formatDistanceToNow(job?.created_at, { addSuffix: false })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const JobActions = ({ job }) => (
    <div className="flex flex-wrap items-left gap-2 mt-4 mb-8">
      <Link
        href={job.source_url}
        target="_blank"
        onClick={handleApply}
        className="flex-1 sm:flex-none"
      >
        <Button className="w-full sm:w-auto min-w-28 text-green-600 bg-green-500/10 border border-green-600/20 hover:bg-green-500/20 hover:text-green-500">
          Apply
        </Button>
      </Link>
      <BookmarkButton jobId={jobId} />
      <ReportPopover jobId={jobId} />
      <JobDropdown job={job} />
    </div>
  );

  const JobDropdown = ({ job }) => {
    const [currentUrl, setCurrentUrl] = useState("");
    useEffect(() => {
      setCurrentUrl(window.location.href);
    }, []);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-9 h-9" size="default">
            <X className="text-foreground" size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mx-6 mt-2">
          {job.company && (
            <DropdownMenuItem onClick={() => router.push(`/companies/${job.company}`)}>
              <Building2 size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
              {job.company}
            </DropdownMenuItem>
          )}
          {user && (
            <DropdownMenuItem onClick={handleSummarizationQuery}>
              <Sparkles size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
              Generate Summary
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const JobFilters = ({ job }) => (
    <div className="flex flex-wrap gap-2 mt-4 mb-8">
      <Link href={`/job-postings?title=${encodeURIComponent(job.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&strictSearch=false`}>
        <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10">
          <Telescope className="w-4 h-4 mr-2" />
          Similar Titles
        </Button>
      </Link>
      {job.location && (
        <>
          <Link href={`/job-postings?location=${encodeURIComponent(getFullStateFromLocation(job.location))}`}>
            <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10">
              <MapPin className="w-4 h-4 mr-2" />
              Jobs in {getFullStateFromLocation(job.location)}
            </Button>
          </Link>
          <Link href={`/job-postings?title=${encodeURIComponent(job.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&location=${encodeURIComponent(getFullStateFromLocation(job.location))}&strictSearch=false`}>
            <Button variant="outline" size="sm" className="text-sm hover:bg-green-500/10">
              <MapPin className="w-4 h-4 mr-2" />
              Similar Jobs Here
            </Button>
          </Link>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4">
          <p className="text-red-500">Error: {error}</p>
        </div>
      );
    }

    if (!job) return null;

    return (
      <div className="p-4">
        <JobHeader job={job} />
        <JobActions job={job} />
        <JobFilters job={job} />
        
        {/* Summary Section */}
        {(job.summary || loadingLLMReponse || llmResponse) && (
          <div className="mb-8">
            <Summarization
              title="Summary"
              message={llmResponse || job.summary}
              loading={loadingLLMReponse}
              error={llmError}
            />
          </div>
        )}

        {/* Rest of content... */}
        <div className="mt-8">
          <div className="w-full">
            <span className="flex flex-row mb-2 gap-4 items-center">
              <h2 className="text-md font-semibold text-foreground">Job Description</h2>
            </span>
            <div
              className="space-y-2 leading-loose text-md break-words text-foreground dark:text-neutral-300"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(stripHTML(decodeHTMLEntities(job.description))),
              }}
            />
          </div>
        </div>

        {/* Similar Jobs */}
        <div className="mt-8">
          <Suspense fallback={<div>Loading similar jobs...</div>}>
            <span className="flex flex-row mb-2 gap-4 items-center">
              <Telescope size={16} strokeWidth={2} className="text-foreground" />
              <h2 className="text-md font-semibold text-foreground">Similar Jobs</h2>
            </span>
            <SimilarJobs jobTitle={job.title} experienceLevel={job.experienceLevel ?? ""} />
          </Suspense>
        </div>

        {/* Company Jobs */}
        <div className="mt-8 mb-8">
          <Suspense fallback={<div>Loading jobs at {job.company}...</div>}>
            <span className="flex flex-row mb-2 gap-4 items-center">
              <Telescope size={16} strokeWidth={2} className="text-foreground" />
              <h2 className="text-md font-semibold text-foreground">More Jobs at {job.company}</h2>
            </span>
            <CompanySimilarJobs company={job.company} />
          </Suspense>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Scroll modal content to top whenever jobId changes
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  }, [jobId]);

  if (isSidebar) {
    return (
      <aside className="fixed top-0 pt-28 bottom-0 w-1/3 overflow-y-auto">
        <div className="h-full pb-24">
          {renderContent()}
        </div>
      </aside>
    );
  } else {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="w-[600px] max-h-[80vh] p-0">
          <div className="max-h-[calc(80vh-2rem)] overflow-y-auto">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}
