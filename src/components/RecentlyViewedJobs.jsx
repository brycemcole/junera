// components/RecentlyViewedJobs.js
import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function RecentlyViewedJobs({ jobs, loading, error }) {
  if (loading) return <SkeletonCard />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (jobs.length === 0) return <p>No recently viewed jobs.</p>;

  return (
    <div>
                <ScrollArea className="h-64">
      {jobs.map((job) => (
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
                </ScrollArea>   
    </div>
  );
}