import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';

export default function RecentlyAppliedJobs({ jobs, loading, error, router }) {
  const [jobData, setJobData] = useState(jobs.appliedJobs);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setJobData(jobs.appliedJobs);
  }, [jobs]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Fetch next page or load more items
      }
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  if (!jobData) return null;
  if (loading) return <div className="space-y-3"><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /></div>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (jobData.length === 0) return <p>No recently applied jobs.</p>;

  return (
    <div>
      {jobData.slice(0, 3).map((job) => (
        <div
          className="mb-2 cursor-pointer"
          key={job.id}
          onClick={() => router.push(`/job-postings/${job.id}`)}
        >
          <p className="hover:underline">{job.company}</p>
          <p className="text-foreground font-medium">{job.title}</p>
          <p className="text-muted-foreground text-xs font-medium">
            {formatDistanceToNow(new Date(job.appliedAt), { addSuffix: true })}
          </p>
        </div>
      ))}
      {jobData.length > 3 && (
        <Link href="/job-postings/applied" className="text-lime-500 hover:underline">
          View all applied jobs
        </Link>
      )}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
