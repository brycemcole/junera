// components/BookmarkedJobs.js
import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from './SkeletonCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookmarkedJobs({ jobs, loading, error }) {
    if (loading) return <div className="space-y-3"><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
  if (jobs.length === 0) return <p>No bookmarked jobs.</p>;

  return (
    <div>
      {jobs.map((job) => (
        <Link href={`/job-postings/${job.id}`} key={job.id}>
          <div className="mb-2">
            <p className="text-lime-500 hover:underline">{job.company}</p>
            <p className="text-foreground font-medium">{job.title}</p>
            <p className="text-muted-foreground text-xs font-medium">
              {formatDistanceToNow(new Date(job.bookmarkedAt))}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}