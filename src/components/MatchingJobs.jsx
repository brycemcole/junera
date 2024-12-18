// components/MatchingJobs.js
import React, { useEffect, useState } from 'react';
import SkeletonCard from './SkeletonCard';
import Link from 'next/link';  
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"

export default function MatchingJobs({ savedSearches, loading, error }) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState(null);

  useEffect(() => {
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
              limit: 20
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

  if (loading || loadingJobs) {
    return (
      <div className="space-y-3">
        <Skeleton className="w-full h-[20px] rounded-full" />
        <Skeleton className="w-full h-[20px] rounded-full" />
        <Skeleton className="w-full h-[20px] rounded-full" />
      </div>
    );
  }

  if (error || errorJobs) {
    return <p className="text-red-500">{error || errorJobs}</p>;
  }

  if (!jobs.length) {
    return <p className="text-muted-foreground text-sm">No matching jobs found for your saved searches.</p>;
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="group relative">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={job.companyLogo} alt={job.company} />
                <AvatarFallback>{job.company?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{job.company}</span>
            </div>
            
            <Link href={`/job-postings/${job.id}`} className="block group-hover:underline">
              <h3 className="text-foreground font-medium mt-1">
                <span className="text-lime-600">{job.title}</span>
                {job.location && <span className="text-foreground"> in {job.location}</span>}
              </h3>
            </Link>

            <div className="text-xs text-foreground mt-1">
              <p>Matching &quot;{job.matchedSearch}&quot;</p>
              <p className="mt-0.5">
                {[
                  job.matchingCriteria.experienceLevel,
                  job.matchingCriteria.title,
                  job.matchingCriteria.location
                ].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}