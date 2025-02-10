import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import ViewStatus from '@/components/ViewStatus';
import { trackJobView } from '@/app/actions/trackJobView';
import { Badge } from "@/components/ui/badge";  // Moved Badge here for better organization
import Button24 from "@/components/button24"
import SharePopover from "@/components/share-popover";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { fullStripHTML, decodeHTMLEntities, parseUSLocations } from "@/lib/job-utils";
import DOMPurify from 'dompurify';

function DateDisplay({ postedDate }) {
    if (!postedDate) {
        return "N/A";
    }

    const date = new Date(postedDate);
    return (
        <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(date, { addSuffix: true, includeSeconds: false })}
        </span>
    );
}

export const JobList = ({ data, loading, error }) => {
    const router = useRouter();
    const user = useAuth();
    const [expandedSummaries, setExpandedSummaries] = useState(new Set());
    const [summaryThreshold, setSummaryThreshold] = useState(160);

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


    const handleJobClick = async (jobId) => {
        await trackJobView(jobId);
        // Next.js handles navigation, no need for window.open
        // router.push(`/job-postings/${jobId}`);  // You can still push if needed, but Link component usually sufficient
    };

    return (
        <div className="md:px-0 border-none space-y-4 md:shadow-none max-w-full">
            {data.map((job, index) => (
                <div
                    key={job.id || index} // Use job.id if available, otherwise index
                    className="flex flex-row items-center gap-4 group py-3 md:py-3 transition duration-200 ease-in-out max-w-[100vw] md:max-w-4xl border-gray-200/50 last:border-none"
                >

                    {/* Job Details */}
                    <div className="flex flex-col min-w-0 gap-0 flex-grow">
                        <div className="flex flex-row items-start gap-2">
                            <div className="flex flex-col gap-1">
                                <h3 className="scroll-m-20 text-md text-foreground font-semibold tracking-tight flex"> {/* Removed items-center */}
                                    {job.company ? (
                                        <Link href={{ pathname: `/companies/${job.company}`, query: router.query }} className="inline-flex items-center">
                                            <Avatar className="w-6 h-6 rounded-full flex-shrink-0 mr-2">
                                                <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} loading="lazy" />
                                                <AvatarFallback className="rounded-full">
                                                    {job.company?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                    ) : (
                                        <Avatar className="w-5 h-5 flex-shrink-0 mr-2">
                                            <AvatarFallback>
                                                {job.company?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="text-lg">
                                        <span className="font-semibold text-gray-500 company-name">{job?.company || "No company name available"}</span>
                                        <span className="mx-[3px]"></span>
                                        <span className="">{job?.title || "No job titles available"}</span>
                                    </div>
                                </h3>

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
                                    job?.description ? (
                                        <div className="text-md mb-1">
                                            <p className={`text-muted-foreground text-[16px] leading-relaxed break-all transition-all duration-300 ${expandedSummaries.has(job.id) ? '' : 'line-clamp-2'}`}>
                                                {DOMPurify.sanitize(fullStripHTML(decodeHTMLEntities(job.description)))}
                                            </p>
                                            {fullStripHTML(decodeHTMLEntities(job.description)).length > summaryThreshold && (
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
                                    ) : null}
                            </div>

                        </div>
                        <div className="flex flex-row gap-2 items-center justify-between">
                            <div className="leading-6 text-sm flex flex-col gap-2">
                                <div className="flex flex-row flex-wrap gap-2 items-center">
                                    {job?.salary || job?.salary_range_str ? (
                                        <Badge variant="outline" className="truncate border-emerald-500 text-emerald-500">
                                            {job.salary || job.salary_range_str}
                                        </Badge>
                                    ) : null}
                                    {job?.location?.trim() && (
                                        <Badge
                                            variant="outline"
                                            className={`truncate border-gray-400  ${job?.location?.toLowerCase().includes('remote') ? 'text-green-500 border-green-500 dark:text-green-600' : 'text-gray-500'}`}
                                        >
                                            {parseUSLocations(job.location).substring(0, 30)}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-row gap-2 items-center">
                                <SharePopover jobId={job.id} size={'small'} />
                                {user ? (
                                    <Button24 jobId={job.id} size={'small'} />
                                ) : null}
                                <Link
                                    href={{ pathname: `/job-postings/${job.id}`, query: router.query }}
                                    onClick={() => handleJobClick(job.id)}
                                    className="ml-auto"
                                >
                                    <Button variant="outline" size="sm" className="sm:w-36 h-8 sm:h-9 sm:text-[14px] text-blue-600 bg-blue-500/10 border border-blue-600/20 hover:bg-blue-500/20 hover:text-blue-500">
                                        View Job
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-center py-4">
                    <LoaderCircle className="animate-spin" />
                </div>
            )}
        </div>
    );
};

export default JobList;