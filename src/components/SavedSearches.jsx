// components/BookmarkedJobs.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function SavedSearches({ data, loading, error }) {
    const [jobCounts, setJobCounts] = useState({});
    const [recentJobCounts, setRecentJobCounts] = useState({});

    useEffect(() => {
        if (data && data.savedSearches) {
            data.savedSearches.forEach(async (search) => {
                const searchParams = JSON.parse(search.search_params);
                const query = new URLSearchParams({
                    title: searchParams.jobTitle || '',
                    experienceLevel: searchParams.experienceLevel || '',
                    location: searchParams.location || ''
                }).toString();

                const response = await fetch(`/api/job-postings/count?${query}`);
                const result = await response.json();
                setJobCounts((prevCounts) => ({
                    ...prevCounts,
                    [search.id]: result.totalJobs
                }));

                const recentQuery = new URLSearchParams({
                    title: searchParams.jobTitle || '',
                    experienceLevel: searchParams.experienceLevel || '',
                    location: searchParams.location || '',
                    sinceDate: search.created_at
                }).toString();

                const recentResponse = await fetch(`/api/job-postings/recent?${recentQuery}`);
                const recentResult = await recentResponse.json();
                setRecentJobCounts((prevCounts) => ({
                    ...prevCounts,
                    [search.id]: recentResult.totalJobs
                }));
            });
        }
    }, [data]);

    if (loading) return <div className="space-y-3"><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!data || !data.savedSearches || data.savedSearches.length === 0) return <p>No saved searches.</p>;

    return (
        <div className="space-y-4">
            {data.savedSearches.map((search) => {
                const searchParams = JSON.parse(search.search_params);
                const jobTitle = searchParams.jobTitle || '';
                const experienceLevel = searchParams.experienceLevel || '';
                const location = searchParams.location || '';
                const createdAt = formatDistanceToNow(new Date(search.created_at)) + ' ago';
                const jobCount = jobCounts[search.id] || '...';
                const recentJobCount = recentJobCounts[search.id] || '...';

                return (
                    <div key={search.id} className="">
                        <Link href={`/job-postings?explevel=${experienceLevel}&location=${location}&title=${jobTitle}`}>
                            <p className="text-sm font-medium hover:underline">
                                <strong className="text-lime-600">{jobTitle || 'Any job'}</strong> in {location || 'Anywhere'}
                            </p>
                        </Link>
                        <p className="text-foreground text-sm">
                            {experienceLevel || 'Any Level'} • {jobCount} jobs found
                        </p>
                        <p className="text-muted-foreground text-xs font-medium">
                            {createdAt} • {recentJobCount} new jobs since saved
                        </p>
                    </div>
                );
            })}
        </div>
    );
}