import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SavedSearches({ data, loading, error }) {
    const [jobCounts, setJobCounts] = useState({});
    const [recentJobCounts, setRecentJobCounts] = useState({});
    const sentinelRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (data && data.savedSearches) {
            data.savedSearches.forEach(async (search) => {
                if (!search.search_params) return;
                const searchParams = search.search_params;
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

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setCurrentPage((prevPage) => prevPage + 1);
            }
        });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    if (loading) return <div className="space-y-3"><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!data || !data.savedSearches || data.savedSearches.length === 0) return <p>No saved searches.</p>;

    return (
        <div className="space-x-2">
            {data.savedSearches.map((search) => {
                const { search_name, search_criteria, created_at, notify, is_active } = search;
                const { title, location, experienceLevel } = search_criteria;
                const createdAt = formatDistanceToNow(new Date(created_at)) + ' ago';
                const jobCount = jobCounts[search.id] || '...';
                const recentJobCount = recentJobCounts[search.id] || '...';

                return (
                <Badge
      variant="outline"
      className="gap-1.5 cursor-pointer hover:bg-accent"
      onClick={() => router.push(`/job-postings/saved-searches/${search.id}`)}
      key={search.id}
    >
      <span
        className={`size-1.5 rounded-full bg-blue-500`}
        aria-hidden="true"
      />
      {search_name}
    </Badge>

                );
            })}
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
}
