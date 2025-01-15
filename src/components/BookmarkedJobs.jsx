import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import JobList from './JobPostings';

export default function BookmarkedJobs({ jobs, loading, error }) {
    const [jobData, setJobData] = useState(jobs);

    useEffect(() => {
        setJobData(jobs);
    }, [jobs]);

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

    if (!Array.isArray(jobData)) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No bookmarked jobs found.</p>
            </div>
        );
    }

    if (jobData.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>You haven&apos;t bookmarked any jobs yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 divide-y">
            <JobList data={jobData} />
        </div>
    );
}
