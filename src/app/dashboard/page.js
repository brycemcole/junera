"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, LogOut } from "lucide-react"; // Ensure correct icons
import { JobCard } from '@/components/job-posting'; // Import JobCard
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';


export default function DashboardPage() {
  const { user, loading } = useAuth(); // Destructure loading
  const router = useRouter();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentlyApplied, setRecentlyApplied] = useState([]);
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]); // Add new state

  useEffect(() => {
    if (!loading) { // Check if loading is complete
      if (!user) {
        router.push('/login');
      } else {
        async function fetchData() {
          try {
            // Fetch recently viewed jobs
            const responseViewed = await fetch('/api/dashboard/recently-viewed', {
              headers: {
                'Authorization': `Bearer ${user.token}`, // Include token if required
              },
            });
            const dataViewed = await responseViewed.json();
            setRecentlyViewed(dataViewed);
          } catch (error) {
            console.error("Error fetching recently viewed jobs:", error);
          }

          try {
            // Fetch recently applied jobs
            const responseApplied = await fetch('/api/dashboard/applied-jobs', {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
            });
            const dataApplied = await responseApplied.json();
            setRecentlyApplied(dataApplied.userJobs);
          } catch (error) {
            console.error("Error fetching recently applied jobs:", error);
          }

          try {
            // Fetch new jobs matching searches
            const responseMatching = await fetch('/api/dashboard/matching-jobs', {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
            });
            const dataMatching = await responseMatching.json();
            setMatchingJobs(dataMatching);
          } catch (error) {
            console.error("Error fetching matching jobs:", error);
          }

          try {
            // Fetch recently launched companies
            const responseCompanies = await fetch('/api/dashboard/recent-companies', {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
            });
            const dataCompanies = await responseCompanies.json();
            setRecentCompanies(dataCompanies);
          } catch (error) {
            console.error("Error fetching recent companies:", error);
          }

          try {
            // Fetch bookmarked jobs
            const responseBookmarks = await fetch('/api/dashboard/bookmarked-jobs', {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
            });
            const dataBookmarks = await responseBookmarks.json();
            setBookmarkedJobs(dataBookmarks);
          } catch (error) {
            console.error("Error fetching bookmarked jobs:", error);
          }
        }

        fetchData();
      }
    }
  }, [user, loading, router]); // Added loading to dependencies

  if (loading) {
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
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-4 col-span-2">
          <CardTitle className="mb-2">Bookmarked Jobs</CardTitle>
          <CardDescription>
            {bookmarkedJobs.length > 0 ? (
              bookmarkedJobs.map(job => (
                <Link href={`/job-postings/${job.id}`} key={job.id}>
                  <div className="mb-2">
                    <p id="companyTitle" className="text-lime-500 hover:underline">{job.company}</p>
                    <p id="jobTitle" className="text-foreground font-medium">{job.title}</p>
                    <p id="jobViewDate" className="text-muted-foreground text-xs font-medium">{formatDistanceToNow(job.bookmarkedAt)}</p>

                  </div>
                </Link>
              ))
            ) : (
              <p>No bookmarked jobs.</p>
            )}
          </CardDescription>
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-2">Recently Viewed Jobs</CardTitle>
          <CardDescription>
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map(job => (
                <Link href={`/job-postings/${job.id}`} key={job.id}>
                <div className="mb-2" key={job.id} >
                  <p id="companyTitle" className="text-lime-500 hover:underline">{job.company}</p>
                  <p id="jobTitle" className="text-foreground text-md font-medium">{job.title}</p>
                  <p id="jobViewDate" className="text-muted-foreground text-xs font-medium">{formatDistanceToNow(job.viewedAt)}</p>

                </div>
                </Link>
              ))
            ) : (
              <p>No recently viewed jobs.</p>
            )}
          </CardDescription>
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-2">Recently Applied Jobs</CardTitle>
          <CardDescription>
            {recentlyApplied.slice(0, 3).map(job => (
              <div className="mb-2" key={job.id} onClick={() => router.push(`/job-postings/${job.id}`)}>              
                <p id="companyTitle" className="text-lime-500 hover:underline">{job.company}</p>
                <p id="jobTitle" className="text-foreground font-medium">{job.title}</p>
                <p id="jobViewDate" className="text-muted-foreground text-xs font-medium">{formatDistanceToNow(job.postedDate)}</p>

              </div>
            ))}
            {recentlyApplied.length > 3 && (
              <>
                <Link href="/job-postings/applied" className="text-lime-500 hover:underline">
                  View all applied jobs
                </Link>
              </>
            )}
          </CardDescription>
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-2">New Jobs Matching Your Searches</CardTitle>
          <CardDescription>
            {matchingJobs.length > 0 ? (
              matchingJobs.map(job => (
                <div key={job.id}>{job.title}</div>
              ))
            ) : (
              <p>No matching jobs found.</p>
            )}
          </CardDescription>
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-2">Recently Launched Companies</CardTitle>
          <CardDescription>
            {recentCompanies.length > 0 ? (
              recentCompanies.map(company => (
                <div key={company.id}>{company.name}</div>
              ))
            ) : (
              <p>No recently launched companies.</p>
            )}
          </CardDescription>
        </Card>


      </div>
    </div>
  );
}