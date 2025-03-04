import React, { useState, useEffect, useRef } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import ViewStatus from '@/components/ViewStatus';
import { Badge } from "@/components/ui/badge";  // Moved Badge here for better organization
import BookmarkButton from "@/components/bookmark-button"
import SharePopover from "@/components/share-popover";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { fullStripHTML, decodeHTMLEntities, parseUSLocations } from "@/lib/job-utils";
import DOMPurify from 'dompurify';
import ViewStatusIndicator from '@/components/view-status-indicator';
import JobPreviewModal from './JobPreviewModal';
import KeywordBadge from './keyword-badge';

function DateDisplay({ postedDate }) {
    if (!postedDate) {
        return "N/A";
    }

    const date = new Date(postedDate);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    let timeString;
    if (diffInHours < 24) {
        if (diffInHours === 0) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            timeString = `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
        } else {
            timeString = `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
        }
    } else {
        timeString = formatDistanceToNow(date, { addSuffix: true });
    }

    return (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
            {timeString}
        </span>
    );
}


export const JobList = ({ data, loading, error, setCid }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useAuth();
    const [expandedSummaries, setExpandedSummaries] = useState(new Set());
    const [summaryThreshold, setSummaryThreshold] = useState(160);
    const [previewJobId, setPreviewJobId] = useState(null);
    const jobRefs = useRef({});
    
    // Track which jobs have already been prefetched
    const prefetchedJobs = useRef(new Set());

    // Get current page from URL
    const currentPage = searchParams.get('page') || '1';

    useEffect(() => {
        const handleResize = () => {
            const newThreshold = window.innerWidth >= 768 ? 300 : 160;
            setSummaryThreshold(newThreshold);
        };
        
        handleResize(); // Set initial value
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const toggleSummary = (jobId) => {
        setExpandedSummaries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    // Handle case where data might be an object (not an array) and no jobs are found
    if (!Array.isArray(data)) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No job postings found.</p>
            </div>
        );
    }


    return (
        <>
        <div className="w-full">
            <div className="w-full">
                {data.map((job, index) => (
                    <Link 
                        href={`/job-postings/${job.id}?fromPage=${currentPage}${
                            searchParams.get('title') ? `&title=${searchParams.get('title')}` : ''
                        }${
                            searchParams.get('explevel') ? `&explevel=${searchParams.get('explevel')}` : ''
                        }${
                            searchParams.get('location') ? `&location=${searchParams.get('location')}` : ''
                        }${
                            searchParams.get('company') ? `&company=${searchParams.get('company')}` : ''
                        }${
                            searchParams.get('keywords') ? `&keywords=${searchParams.get('keywords')}` : ''
                        }${
                            searchParams.get('saved') ? `&saved=${searchParams.get('saved')}` : ''
                        }`} 
                        prefetch={true}
                        key={job.id || index}
                    >
                    <div
                        id={`job-${job.id}`}
                        ref={el => { jobRefs.current[job.id] = el; }}
                        className="flex flex-row items-center gap-4 group py-3 my-4 md:py-3 transition duration-200 ease-in-out w-full relative" // Added relative positioning
                    >
                        <div className="flex flex-col min-w-0 gap-0 flex-grow overflow-hidden">
                            <div className="flex flex-row items-center gap-2">
                            {/*
                            job.company ? (
                                            <div className="inline-flex items-center flex-shrink-0">
                                                <Avatar className="w-14 h-14 rounded-md flex-shrink-0 mr-2">
                                                    <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} loading="lazy" />
                                                    <AvatarFallback className="rounded-md">
                                                        {job.company?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        ) : (
                                            <Avatar className="w-5 h-5 flex-shrink-0 mr-2">
                                                <AvatarFallback className="rounded-md">
                                                    {job.company?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )*/}
                                <div className="flex flex-col gap-2 w-full">
                                    <h3 className="scroll-m-20 text-md text-foreground font-semibold tracking-tight flex overflow-hidden"> {/* Removed items-center */}
                                        <div className="text-sm truncate">
                                            <span className="font-medium company-name truncate">{job?.company || "No company name available"}</span>
                                        </div>
                                    </h3>
                                    <div className="text-md font-semibold text-foreground job-title group-hover:underline transition duration-200 ease-in-out">{job?.title || "No job title available"}</div>


                                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                    {parseUSLocations(job?.location)}
                                    {job?.location && job?.location !== 'null' && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            </>
                                    )}
                                        <DateDisplay postedDate={job.postedDate} />
                                        {job.experienceLevel && job.experienceLevel !== 'null' && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="font-medium">{job.experienceLevel}</span>
                                            </>
                                        )}
                                        {job.remoteKeyword && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-emerald-600 font-medium">{job.remoteKeyword}</span>
                                            </>
                                        )}
                                        {(job?.salary || job?.salary_range_str) && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-emerald-600 font-medium">
                                                    {job.salary || job.salary_range_str}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {job?.summary ? (
                                        <div className="mb-1">
                                            <p className={`text-muted-foreground text-[16px] break-words transition-all duration-300 ${expandedSummaries.has(job.id) ? '' : 'line-clamp-2'}`}>
                                                {job.summary}
                                            </p>
                                            {job.summary.length > summaryThreshold && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleSummary(job.id);
                                                    }}
                                                    className="text-emerald-500 hover:text-emerald-600 text-sm font-medium mt-1"
                                                >
                                                    {expandedSummaries.has(job.id) ? 'Hide summary' : 'Show summary'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                        :
                                        null}
                                        
                                    {job.keywords && job.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground text-center items-center">
                                            {job.keywords.slice(0, 5).map((keyword, idx) => (
                                                <KeywordBadge 
                                                    key={idx}
                                                    keyword={keyword}
                                                    clickable={true}
                                                    colorScheme="blue"
                                                />
                                            ))}
                                            {job.keywords.length > 5 && (
                                                <>
                                                    +{job.keywords.length - 5} more
                                                    </>
                                            )}
                                        </div>
                                    )}
                                                                <div className="flex flex-row gap-2 items-center justify-between flex-wrap">
{/*
                                <div className="flex flex-row gap-2 items-center">
                                    <div onClick={() => handleViewJob(job)} className="ml-auto focus:outline-none">
                                        <ViewStatusIndicator 
                                            jobId={job.id} 
                                            onViewStatusChange={(isViewed) => (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className={`sm:w-36 h-7 sm:h-8 sm:text-[14px] ${
                                                        isViewed 
                                                        ? 'text-muted-foreground bg-muted/50 border-muted hover:bg-muted hover:text-muted-foreground' 
                                                        : 'text-blue-600 bg-blue-500/10 border border-blue-600/20 hover:bg-blue-500/20 hover:text-blue-500'
                                                    }`}
                                                >
                                                    {isViewed ? 'Viewed' : 'View Job'}
                                                </Button>
                                            )}
                                        />
                                    </div>
                                    <SharePopover jobId={job.id} size={'small'} />
                                    {user ? (
                                        <BookmarkButton jobId={job.id} size={'small'} />
                                    ) : null}
                                </div>
                                */}
                                <div className="text-sm flex flex-col gap-2 flex-end">
                                    <div className="flex flex-row flex-wrap gap-2 items-center">
                                    </div>
                                </div>
                            </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    </Link>
                ))}
                {loading && (
                    <div className="flex justify-center py-4">
                        <LoaderCircle className="animate-spin" />
                    </div>
                )}
            </div>
        </div>
                    </>
    );
};

export default JobList;