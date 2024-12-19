// src/app/dashboard/page.js
"use client";
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import SkeletonCard from '@/components/SkeletonCard';
import { Skeleton } from "@/components/ui/skeleton"
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import CollapsibleDemo from './collapsible';

// Lazy load dashboard sections
const BookmarkedJobs = memo(lazy(() => import('@/components/BookmarkedJobs')));
const SavedSearches = memo(lazy(() => import('@/components/SavedSearches')));
const RecentlyViewedJobs = memo(lazy(() => import('@/components/RecentlyViewedJobs')));
const RecentlyAppliedJobs = memo(lazy(() => import('@/components/RecentlyAppliedJobs')));
const MatchingJobs = memo(lazy(() => import('@/components/MatchingJobs')));
const RecentCompanies = memo(lazy(() => import('@/components/RecentCompanies')));

export default function DashboardPage() {
  const { user, loading } = useAuth(); // Destructure loading
  const router = useRouter();

  // Data States
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentlyApplied, setRecentlyApplied] = useState([]);
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Loading States
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(true);
  const [loadingRecentlyApplied, setLoadingRecentlyApplied] = useState(true);
  const [loadingMatchingJobs, setLoadingMatchingJobs] = useState(true);
  const [loadingRecentCompanies, setLoadingRecentCompanies] = useState(true);
  const [loadingBookmarkedJobs, setLoadingBookmarkedJobs] = useState(true);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(true);

  // Error States
  const [errorRecentlyViewed, setErrorRecentlyViewed] = useState(null);
  const [errorRecentlyApplied, setErrorRecentlyApplied] = useState(null);
  const [errorMatchingJobs, setErrorMatchingJobs] = useState(null);
  const [errorRecentCompanies, setErrorRecentCompanies] = useState(null);
  const [errorBookmarkedJobs, setErrorBookmarkedJobs] = useState(null);
  const [errorSavedSearches, setErrorSavedSearches] = useState(null);

  // Add a simple cache
  const cache = {};

  // Helper functions for caching
  const getCachedData = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > 5 * 60 * 1000) { // 5 minutes
      localStorage.removeItem(key);
      return null;
    }
    return data;
  };

  const setCachedData = (key, data) => {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  };

  useEffect(() => {
    if (!loading) { // Check if loading is complete
      if (!user) {
        router.push('/login');
      } else {
        async function fetchData() {
          const headers = {
            'Authorization': `Bearer ${user.token}`,
          };

          // Helper function to fetch and cache data
          const fetchAndCache = async (url, setData, setError, setLoading, cacheKey) => {
            const cachedData = getCachedData(cacheKey);
            try {
              const response = await fetch(url, { headers });
              if (!response.ok) throw new Error(`Error fetching ${cacheKey}.`);
              const data = await response.json();
              setCachedData(cacheKey, data);
              setData(data);
            } catch (error) {
              console.error(error);
              setError(error.message);
            } finally {
              setLoading(false);
            }
          };

          // Fetch Recently Viewed Jobs
          await fetchAndCache('/api/dashboard/recently-viewed', setRecentlyViewed, setErrorRecentlyViewed, setLoadingRecentlyViewed, 'recentlyViewed');

          // Fetch Saved Searches
          await fetchAndCache('/api/saved-searches', setSavedSearches, setErrorSavedSearches, setLoadingSavedSearches, 'savedSearches');

          // Fetch Recently Applied Jobs
          await fetchAndCache('/api/dashboard/applied-jobs', setRecentlyApplied, setErrorRecentlyApplied, setLoadingRecentlyApplied, 'applied-jobs');

          // Fetch Matching Jobs
          await fetchAndCache('/api/dashboard/matching-jobs', setMatchingJobs, setErrorMatchingJobs, setLoadingMatchingJobs, 'matchingJobs');

          // Fetch Recent Companies
          await fetchAndCache('/api/dashboard/recent-companies', setRecentCompanies, setErrorRecentCompanies, setLoadingRecentCompanies, 'recentCompanies');

          // Fetch Bookmarked Jobs
          await fetchAndCache('/api/dashboard/bookmarked-jobs', setBookmarkedJobs, setErrorBookmarkedJobs, setLoadingBookmarkedJobs, 'bookmarkedJobs');
        }

        fetchData();
      }
    }
  }, [user, loading, router]);

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
        <Suspense fallback={<Skeleton />}>
          <Card className="border-none col-span-2 relative">
            <CardTitle className="mb-4">
              New Jobs Matching Your Searches
              {loadingSavedSearches && <LoaderCircle className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex" size={16} strokeWidth={2} aria-hidden="true" />}
              {errorSavedSearches && (<CircleAlert className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60" size={16} strokeWidth={2} aria-hidden="true" />)}
            </CardTitle>
            <CardDescription>
              <MatchingJobs
                loading={loadingSavedSearches}
                error={errorSavedSearches}
                savedSearches={savedSearches}
              />
            </CardDescription>
          </Card>
        </Suspense>
        <Suspense fallback={<Skeleton />}>
          <Card className="py-2 border-none shadow-none bg-transparent relative col-span-2 md:col-span-1">
            <CardTitle className="mb-4 w-full flex">
              Saved Searches
              {loadingSavedSearches && <LoaderCircle className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex" size={16} strokeWidth={2} aria-hidden="true" />}
              {errorSavedSearches && (<CircleAlert className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60" size={16} strokeWidth={2} aria-hidden="true" />)}
            </CardTitle>
            <SavedSearches data={savedSearches} loading={loadingSavedSearches} error={errorSavedSearches} />
            <Button variant="ghost" size="sm" className="absolute right-0 font-mono decoration-dotted underline underline-offset-4 top-0 ml-auto" onClick={() => router.push('/job-postings/saved-searches')}>View All</Button>

          </Card>
        </Suspense>

        <Suspense fallback={<Skeleton />}>
          <Card className="border-transparent shadow-none col-span-2 relative">
            <CardTitle className="mb-4">
              Bookmarked Jobs
              {loadingBookmarkedJobs && <LoaderCircle className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex" size={16} strokeWidth={2} aria-hidden="true" />}
              {errorBookmarkedJobs && (<CircleAlert className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60" size={16} strokeWidth={2} aria-hidden="true" />)}
            </CardTitle>
            <CardDescription>
              <BookmarkedJobs
                jobs={bookmarkedJobs.bookmarkedJobs}
                loading={loadingBookmarkedJobs}
                error={errorBookmarkedJobs}
              />
            </CardDescription>
          </Card>
        </Suspense>

        <Suspense fallback={<Skeleton />}>
          <Card className="p-4 relative">
            <CardTitle className="mb-2">
              Recently Viewed Jobs
              {loadingRecentlyViewed && <LoaderCircle className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex" size={16} strokeWidth={2} aria-hidden="true" />}
              {errorRecentlyViewed && (<CircleAlert className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60" size={16} strokeWidth={2} aria-hidden="true" />)}
            </CardTitle>
            <CardDescription>
              <RecentlyViewedJobs
                jobs={recentlyViewed}
                loading={loadingRecentlyViewed}
                error={errorRecentlyViewed}
              />
            </CardDescription>
          </Card>
        </Suspense>


        <Suspense fallback={<SkeletonCard />}>
          <Card className="p-4 relative col-span-2">
            <CardTitle className="mb-2">
              Recently Launched companies
              {loadingRecentCompanies && <LoaderCircle className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex" size={16} strokeWidth={2} aria-hidden="true" />}
              {errorRecentCompanies && (<CircleAlert className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60" size={16} strokeWidth={2} aria-hidden="true" />)}
            </CardTitle>
            <CardDescription>
              <RecentCompanies
                companies={recentCompanies}
                loading={loadingRecentCompanies}
                error={errorRecentCompanies}
              />
            </CardDescription>
          </Card>
        </Suspense>
        <Suspense fallback={<Skeleton />}>
          <Card className="p-4 relative">
            <CardTitle className="mb-2">
              Recently Applied Jobs
              {loadingRecentlyApplied && <LoaderCircle className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex" size={16} strokeWidth={2} aria-hidden="true" />}
              {errorRecentlyApplied && (<CircleAlert className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60" size={16} strokeWidth={2} aria-hidden="true" />)}
            </CardTitle>
            <CardDescription>
              <RecentlyAppliedJobs
                jobs={recentlyApplied} // This now contains the {appliedJobs: [...]} structure
                loading={loadingRecentlyApplied}
                error={errorRecentlyApplied}
                router={router}
              />
            </CardDescription>
          </Card>
        </Suspense>
      </div>
    </div>
  );
}