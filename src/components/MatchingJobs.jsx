import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton"
import JobList from './JobPostings';

export default function MatchingJobs({ loading, error }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.token) return;

      const endpoint = (!user.jobPrefsTitle && !user.jobPrefsLocation && !user.jobPrefsLevel) 
        ? '/api/job-postings' 
        : '/api/dashboard/matching-jobs';

      try {
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const data = await response.json();
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setErrorJobs(error.message);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
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

  return (
    <ScrollArea>
      <JobList data={jobs} loading={loading} error={error} />
      <ScrollBar />
    </ScrollArea>
  );
}