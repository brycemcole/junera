"use client"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns";
import { MapPin, Briefcase, Calendar, DollarSign } from "lucide-react";
import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function CollapsibleDemo({ title, savedSearches, open = false, loading, errorMatchingJobs, props }) {
    const [isOpen, setIsOpen] = React.useState(open)
    const router = useRouter();
    const [jobs, setJobs] = React.useState([]);
    const [loadingJobs, setLoadingJobs] = React.useState(true);
    const [errorJobs, setErrorJobs] = React.useState(null);

    React.useEffect(() => {
        if (savedSearches && savedSearches?.savedSearches) {
            const fetchJobs = async () => {
                try {
                    const allJobs = [];
                    for (const search of savedSearches?.savedSearches) {
                        const { search_criteria, search_name } = search;
                        const query = new URLSearchParams({
                            title: search_criteria.title || '',
                            experienceLevel: search_criteria.experienceLevel || '',
                            location: search_criteria.location || '',
                            limit: 5
                        }).toString();

                        const response = await fetch(`/api/job-postings/by-saved-search?${query}`);
                        if (!response.ok) throw new Error('Failed to fetch matching jobs');

                        const result = await response.json();
                        const jobsWithSearchInfo = result.jobs.map(job => ({
                            ...job,
                            matchedSearch: search_name,
                            matchingCriteria: {
                                title: search_criteria.title,
                                location: search_criteria.location,
                                experienceLevel: search_criteria.experienceLevel
                            }
                        }));
                        allJobs.push(...jobsWithSearchInfo);
                    }
                    // Remove duplicates and sort by date
                    const uniqueJobs = Array.from(
                        new Map(allJobs.map(job => [job.id, job])).values()
                    ).sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));

                    setJobs(uniqueJobs);
                } catch (error) {
                    setErrorJobs("Error fetching matching jobs");
                    console.error(error);
                } finally {
                    setLoadingJobs(false);
                }
            };

            fetchJobs();
        } else {
            setLoadingJobs(false);
        }
    }, [savedSearches]);


    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="w-full h-[20px] rounded-full" />
                <Skeleton className="w-full h-[20px] rounded-full" />
                <Skeleton className="w-full h-[20px] rounded-full" />
            </div>
        );
    }

    if (!savedSearches) {
        return null
    }
    console.log(savedSearches);
    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full space-y-2"
        >
            <div className="flex items-center justify-between space-x-4">
                <h4 className="text-sm font-semibold">
                    {title}
                </h4>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <div
                className="rounded-md border px-4 py-3 flex flex-col gap-2 text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out"
                onClick={() => router.push(`/job-postings/${jobs[0]?.id}`)}
            >
                <div className="flex items-center gap-4">
                    {/* Company Logo */}
                    {jobs[0]?.companyLogo ? (
                        <Avatar alt={jobs[0].company} className="w-8 h-8 rounded-full">
                            <AvatarImage src={jobs[0].companyLogo} onError={(e) => e.target.remove()} />
                            <AvatarFallback>{jobs[0].company?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    ) : (
                        (
                            <Avatar alt={jobs[0]?.company} className="w-8 h-8 rounded-full">
                                <AvatarFallback>{jobs[0]?.company?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )
                    )}
                    {/* Company Name and Title */}
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                            {jobs[0]?.company || "No company name available"}
                        </span>
                        <span className="font-semibold text-base">
                            {jobs[0]?.title || "No job titles available"}
                        </span>
                    </div>
                </div>
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <p className="line-clamp-2">

                            ${jobs[0]?.description}
                        </p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-foreground" />
                        <span>{jobs[0]?.salary?.toLocaleString() || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-foreground" />
                        <span>{jobs[0]?.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-foreground" />
                        <span>{jobs[0]?.experienceLevel || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-foreground" />
                        <span>
                            {jobs[0]?.postedDate
                                ? `${formatDistanceToNow(new Date(jobs[0].postedDate), {
                                    addSuffix: true,
                                })}`
                                : "N/A"}
                        </span>
                    </div>
                </div>
            </div>
            <CollapsibleContent className="space-y-2">
                {jobs.slice(1).map((posting) => (
                    <div key={posting.id}
                        className="rounded-md grid-cols-2 border px-4 py-3 text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out"
                        onClick={() => router.push(`/job-postings/${posting.id}`)}
                    >
                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-3">
                            {posting.companyLogo ? (
                                <Avatar alt={posting.company} className="w-8 h-8 rounded-full">
                                    <AvatarImage src={posting.companyLogo} onError={(e) => e.target.remove()} />
                                    <AvatarFallback>{posting.company?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <Avatar alt={posting.company} className="w-8 h-8 rounded-full">
                                    <AvatarFallback>{posting.company?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">{posting?.company || "No company name available"}</span>
                                <span className="font-semibold text-base">{posting?.title || "No job titles available"}</span>
                            </div>
                        </div>
                        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <p className="line-clamp-2">
                                    ${posting?.description}
                                </p>
                            </div>
                        </div>
                        {/* Details Section */}
                        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-foreground" />
                                <span>{posting?.salary?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-foreground" />
                                <span>{posting?.location || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-3 w-3 text-foreground" />
                                <span>{posting?.experienceLevel || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-foreground" />
                                <span>
                                    {posting?.postedDate
                                        ? `${formatDistanceToNow(new Date(posting.postedDate), { addSuffix: true })}`
                                        : "N/A"}
                                </span>

                            </div>
                        </div>
                    </div>
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
}
