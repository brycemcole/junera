// components/MatchingJobs.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import SkeletonCard from './SkeletonCard';
import Link from 'next/link';  
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

export default function MatchingJobs({ loading, error }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState(null);

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/dashboard/matching-jobs', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch matching jobs');
        }

        const data = await response.json();
        console.log('Raw jobs data:', data); // Debug log
        
        // Ensure we're getting an array of jobs, even if empty
        const jobsArray = Array.isArray(data.jobs) ? data.jobs : [];
        
        const processedJobs = jobsArray
          .filter(job => job && typeof job === 'object') // Filter out null/undefined/non-object values
          .map(job => ({
            id: job.id || job.job_id || '',
            title: job.title || '',
            company: job.company || '',
            companyLogo: job.company ? 
              `https://logo.clearbit.com/${encodeURIComponent(job.company.replace('.com', ''))}.com` : 
              "/default.png",
            location: job.location || '',
            experienceLevel: job.experienceLevel || job.experiencelevel || '',
            postedDate: job.postedDate || job.created_at || '',
            matchingCriteria: null // Remove matching criteria for now if it's causing issues
          }));

        setJobs(processedJobs);
      } catch (error) {
        console.error('Error fetching matching jobs:', error);
        setErrorJobs(error.message);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchMatchingJobs();
  }, [user]);

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
    <ScrollArea className="">
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id || Math.random()} className="group relative">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={job.companyLogo} alt={job.company || ''} />
                <AvatarFallback>{(job.company || '')[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{job.company}</span>
            </div>
            
            <Link href={`/job-postings/${job.id}`} className="block group-hover:underline">
              <h3 className="text-foreground font-medium mt-1">
                <span className="">{job.title}</span>
                {job.location && <span className="text-foreground"> in {job.location}</span>}
              </h3>
            </Link>

            {/* Remove the matching criteria section for now */}
          </div>
        ))}
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}