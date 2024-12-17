// components/BookmarkedJobs.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

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
                const { search_name, search_criteria, created_at, notify, is_active } = search;
                const { title, location, experienceLevel } = search_criteria;
                const createdAt = formatDistanceToNow(new Date(created_at)) + ' ago';
                const jobCount = jobCounts[search.id] || '...';
                const recentJobCount = recentJobCounts[search.id] || '...';

                return (
                    <div key={search.id} className="p-4 border rounded-lg hover:border-lime-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{search_name}</h3>
                            {notify && (
                                <Bell className="h-4 w-4 text-lime-600" />
                            )}
                        </div>
                        <Link href={`/job-postings?explevel=${experienceLevel}&location=${location}&title=${title}`}>
                            <p className="text-sm hover:underline">
                                <strong className="text-lime-600">{title || 'Any job'}</strong> in {location || 'Anywhere'}
                            </p>
                        </Link>
                        <p className="text-foreground text-sm">
                            {experienceLevel || 'Any Level'} • {jobCount} jobs found
                        </p>
                        <p className="text-muted-foreground text-xs font-medium">
                            {createdAt} • {recentJobCount} new jobs since saved
                        </p>
                        {!is_active && (
                            <p className="text-yellow-600 text-xs mt-2">This search is currently inactive</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}