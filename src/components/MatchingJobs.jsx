import React, { useEffect, useState, useRef } from 'react';
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
import JobList from './JobPostings';

export default function MatchingJobs({ loading, error }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/dashboard/matching-jobs?page=${currentPage}`, {
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

        setJobs((prevJobs) => [...prevJobs, ...processedJobs]);
      } catch (error) {
        console.error('Error fetching matching jobs:', error);
        setErrorJobs(error.message);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchMatchingJobs();
  }, [user, currentPage]);

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
        <JobList data={jobs} />
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}
