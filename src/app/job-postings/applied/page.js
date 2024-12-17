"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

function AppliedJobs({ jobs }) {
  if (!Array.isArray(jobs)) {
    return <p>No applied jobs found.</p>;
  }

  if (jobs.length === 0) {
    return <p>You haven&apos;t applied to any jobs yet.</p>;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Link href={`/job-postings/${job.id}`} key={job.id}>
          <div className="mb-4 group">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={job.companyLogo} alt={job.company} />
                <AvatarFallback>{job.company?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{job.company}</span>
            </div>

            <div className="mt-1">
              <h3 className="text-foreground font-medium group-hover:underline">
                <span className="text-lime-600">{job.title}</span>
                {job.location && <span className="text-muted-foreground text-sm"> in {job.location}</span>}
              </h3>
            </div>

            <p className="text-muted-foreground text-xs mt-1">
              Applied {formatDistanceToNow(new Date(job.appliedAt))} ago
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function AppliedJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        async function fetchAppliedJobs() {
          try {
            const response = await fetch('/api/dashboard/applied-jobs', {
              headers: {
                'Authorization': `Bearer ${user.token}`
              },
            });
            const data = await response.json();
            setAppliedJobs(data);
          } catch (error) {
            console.error("Error fetching applied jobs:", error);
          } finally {
            setIsFetching(false);
          }
        }
        fetchAppliedJobs();
      }
    }
  }, [user, loading, router]);

  if (loading || isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-gray-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 p-4 max-w-4xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/job-postings">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Applied</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold mb-4">Applied Jobs</h1>
      <div className="flex flex-col">
        <AppliedJobs jobs={appliedJobs?.appliedJobs} />
      </div>
    </div>
  );
}
