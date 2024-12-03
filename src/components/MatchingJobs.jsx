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
            console.log('Search:', search);
            const searchParams = JSON.parse(search.search_params);
            const query = new URLSearchParams({
              title: searchParams.jobTitle || '',
              experienceLevel: searchParams.experienceLevel || '',
              location: searchParams.location || '',
              limit: 5 // Limit the number of jobs fetched per search
            }).toString();

            const response = await fetch(`/api/job-postings/by-saved-search?${query}`);
            const result = await response.json();
            const jobsWithSearchInfo = result.jobs.map(job => ({
              ...job,
              matchingString: `Matching: ${searchParams.experienceLevel || 'Any'} • ${searchParams.jobTitle || 'Any'} in ${searchParams.location || 'Any'}`
            }));
            allJobs.push(...jobsWithSearchInfo);
          }
          const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());
          setJobs(uniqueJobs);
        } catch (error) {
          setErrorJobs("Error fetching jobs based on saved searches.");
        } finally {
          setLoadingJobs(false);
        }
      };

      fetchJobs();
    } else {
      setLoadingJobs(false);
    }
  }, [savedSearches]);

  if (loading || loadingJobs) return <div className="space-y-3"><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /></div>;
  if (error || errorJobs) return <p className="text-red-500">{error || errorJobs}</p>;
  if (!savedSearches) return <p>No matching jobs found.</p>;

  return (
    <div>
        <ScrollArea className="h-64">
      {jobs.map((job) => (
        <div key={job.id} className="mb-4">
            <Avatar className="mr-2 h-5 w-5 float-left">
                <AvatarImage src={job.companyLogo} alt={job.companyName} />
                <AvatarFallback>{job.companyName[0]}</AvatarFallback>
            </Avatar>
        <p className="text-sm text-foreground">{job.companyName}</p>
          <Link href={`/job-postings/${job.id}`} className="hover:underline">
          <p className="text-foreground font-medium"><strong className="text-lime-600 font-medium">{job.title}</strong> in {job.location}</p>
            </Link>
          <p className="text-sm text-muted-foreground">{job.experienceLevel}</p>
          <p className="text-xs text-muted-foreground">{job.matchingString}</p>
        </div>
      ))}
        </ScrollArea>   
    </div>
  );
}