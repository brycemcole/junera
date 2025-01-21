"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { JobList } from '@/components/JobPostings';

export default function AppliedJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
            setJobs(data.appliedJobs);
          } catch (error) {
            console.error("Error fetching applied jobs:", error);
            setError("Failed to load applied jobs");
          } finally {
            setIsLoading(false);
          }
        }
        fetchAppliedJobs();
      }
    }
  }, [user, loading, router]);

  return (
    <div className="container mx-auto py-0 p-4 max-w-4xl">
      <section className="mb-4">
        <h1 className="text-lg font-[family-name:var(--font-geist-mono)] font-medium mb-1">
          Applied Jobs
        </h1>
        <p className="text-sm text-muted-foreground">
          View all the jobs you&apos;ve applied to. Click on a job to view more details.
        </p>
      </section>
      <JobList 
        data={jobs}
        loading={isLoading}
        error={error}
      />
    </div>
  );
}
