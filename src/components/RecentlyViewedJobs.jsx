import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function RecentlyViewedJobs({ jobs, loading, error }) {
  const [jobData, setJobData] = useState(jobs);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setJobData(jobs);
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

  if (loading) return <SkeletonCard />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (jobData.length === 0) return <p>No recently viewed jobs.</p>;

  return (
    <div>
      <ScrollArea className="h-64">
        {jobData.map((job) => (
          <Link href={`/job-postings/${job.id}`} key={job.id}>
            <div className="mb-2">
              <p className="text-lime-500 hover:underline">{job.company}</p>
              <p className="text-foreground text-md font-medium">{job.title}</p>
              <p className="text-muted-foreground text-xs font-medium">
                {formatDistanceToNow(new Date(job.viewedAt))}
              </p>
            </div>
          </Link>
        ))}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </ScrollArea>
    </div>
  );
}
