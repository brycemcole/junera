// components/BookmarkedJobs.js
import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BookmarkedJobs({ jobs, loading, error }) {
    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="w-full h-[20px] rounded-full" />
                <Skeleton className="w-full h-[20px] rounded-full" />
                <Skeleton className="w-full h-[20px] rounded-full" />
            </div>
        );
    }
    

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!Array.isArray(jobs)) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No bookmarked jobs found.</p>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>You haven't bookmarked any jobs yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 divide-y">
            {jobs?.map((job) => (
                <Link href={`/job-postings/${job.id}`} key={job.id}>
                    <div className="py-4 group rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={job.companyLogo} alt={job.company} />
                                <AvatarFallback>{job.company?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{job.company}</span>
                        </div>

                        <div className="mt-1">
                            <h3 className="text-foreground font-medium group-hover:underline">
                                <span className="text-primary">{job.title}</span>
                                {job.location && <span className="text-muted-foreground text-sm"> in {job.location}</span>}
                            </h3>
                        </div>

                        <p className="text-muted-foreground text-xs mt-1">
                            Bookmarked {formatDistanceToNow(new Date(job.bookmarkedAt))} ago
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}