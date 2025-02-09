// src/app/dashboard/page.js
"use client";
import React, { useEffect, useState, Suspense, lazy, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import SkeletonCard from '@/components/SkeletonCard';
import { Skeleton } from "@/components/ui/skeleton"
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import CollapsibleDemo from './collapsible';
import JobList from '@/components/JobPostings';

// Lazy load dashboard sections
const BookmarkedJobs = memo(lazy(() => import('@/components/BookmarkedJobs')));
const SavedSearches = memo(lazy(() => import('@/components/SavedSearches')));
const RecentlyViewedJobs = memo(lazy(() => import('@/components/RecentlyViewedJobs')));
const RecentlyAppliedJobs = memo(lazy(() => import('@/components/RecentlyAppliedJobs')));
const MatchingJobs = memo(lazy(() => import('@/components/MatchingJobs')));

export default function DashboardPage() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  // Move all state declarations to the top
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [featuredBookmark, setFeaturedBookmark] = useState(null);
  const [similarJobs, setSimilarJobs] = useState({ baseJob: null, similarJobs: [] });
  const [preferredJobs, setPreferredJobs] = useState([]);

  // Loading States
  const [loadingMatchingJobs, setLoadingMatchingJobs] = useState(true);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(true);
  const [loadingSimilarJobs, setLoadingSimilarJobs] = useState(true);
  const [loadingFeaturedBookmark, setLoadingFeaturedBookmark] = useState(true);
  const [loadingPreferredJobs, setLoadingPreferredJobs] = useState(true);

  // Error States
  const [errorMatchingJobs, setErrorMatchingJobs] = useState(null);
  const [errorSavedSearches, setErrorSavedSearches] = useState(null);
  const [errorSimilarJobs, setErrorSimilarJobs] = useState(null);
  const [errorFeaturedBookmark, setErrorFeaturedBookmark] = useState(null);
  const [errorPreferredJobs, setErrorPreferredJobs] = useState(null);

  // Filter-removal tracking
  const [relaxedFilters, setRelaxedFilters] = useState({
    removedLocation: false,
    removedTitle: false
  });

  // Keep track of location/title filters separately, so we can remove them if no results
  const [locationFilter, setLocationFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');

  // Pagination & "hasMore" state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Ref for intersection observer
  const observer = useRef(null);

  // Authentication effect
  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, initialized, router]);

  // On user load, initialize filter states from user preferences
  useEffect(() => {
    if (user) {
      setLocationFilter(user?.jobPrefsLocation?.[0] || '');
      setTitleFilter(user?.jobPrefsTitle?.[0] || '');
    }
  }, [user]);

  // Simple caching helpers
  const getCachedData = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { timestamp, data } = JSON.parse(cached);
    // Expire after 5 minutes
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  };

  const setCachedData = (key, data) => {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  };

  // Similar Jobs for Featured Bookmark
  const fetchSimilarJobsForBookmark = async (bookmark, headers) => {
    if (!bookmark) return;

    const searchParams = new URLSearchParams({
      title: bookmark.title,
      location: bookmark.location,
      experienceLevel: bookmark.experienceLevel,
      limit: 5,
    });

    try {
      const response = await fetch(`/api/job-postings?${searchParams.toString()}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch similar jobs');
      const data = await response.json();
      setSimilarJobs({
        baseJob: bookmark,
        similarJobs: data.jobPostings || []
      });
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
      setErrorSimilarJobs(error.message);
    } finally {
      setLoadingSimilarJobs(false);
    }
  };

  // Main fetch for Preferred Jobs, using the local states for location/title
  const fetchPreferredJobs = async (page = 1) => {
    setLoadingPreferredJobs(true);

    try {
      const headers = {
        'Authorization': `Bearer ${user?.token}`
      };

      const searchParams = new URLSearchParams({
        title: titleFilter,
        location: locationFilter,
        page: page.toString(),
        limit: '10',
        applyJobPrefs: 'true'
      });

      const response = await fetch(`/api/job-postings?${searchParams.toString()}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch preferred jobs');
      const data = await response.json();

      // The API might return hasMore in its metadata
      if (data.metadata) {
        setHasMore(data.metadata.hasMore);
      }

      const jobPostings = data.jobPostings || [];

      if (jobPostings.length > 0) {
        // If we got results, just append/prepend them
        setPreferredJobs(prev =>
          page === 1 ? jobPostings : [...prev, ...jobPostings]
        );
      } else {
        // No jobs found for this page -> remove a filter if possible
        if (!relaxedFilters.removedLocation && locationFilter) {
          console.log("No jobs found. Removing LOCATION filter and retrying...");
          setRelaxedFilters(prev => ({ ...prev, removedLocation: true }));
          setLocationFilter('');     // Trigger the effect that fetches again
          setPreferredJobs([]);      // Clear old results so we start fresh
          setCurrentPage(1);
        } else if (!relaxedFilters.removedTitle && titleFilter) {
          console.log("No jobs found. Removing TITLE filter and retrying...");
          setRelaxedFilters(prev => ({ ...prev, removedTitle: true }));
          setTitleFilter('');        // Trigger the effect that fetches again
          setPreferredJobs([]);
          setCurrentPage(1);
        } else {
          // We've removed all we can remove, so there are truly no more jobs
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching preferred jobs:', error);
      setErrorPreferredJobs(error.message);
    } finally {
      setLoadingPreferredJobs(false);
    }
  };

  // Fetch data after we know the user is loaded (or not)
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      async function fetchData() {
        const headers = {
          'Authorization': `Bearer ${user.token}`,
        };

        // Helper fetch & cache
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

        // Fetch Saved Searches
        await fetchAndCache(
          '/api/saved-searches',
          setSavedSearches,
          setErrorSavedSearches,
          setLoadingSavedSearches,
          'savedSearches'
        );

        // Fetch Matching Jobs
        await fetchAndCache(
          '/api/dashboard/matching-jobs',
          setMatchingJobs,
          setErrorMatchingJobs,
          setLoadingMatchingJobs,
          'matchingJobs'
        );

        // Fetch featured bookmark
        try {
          const response = await fetch('/api/dashboard/featured-bookmark', { headers });
          if (!response.ok) throw new Error('Failed to fetch featured bookmark');
          const bookmark = await response.json();
          setFeaturedBookmark(bookmark);
          setCachedData('featuredBookmark', bookmark);

          // After getting the featured bookmark, fetch similar jobs
          await fetchSimilarJobsForBookmark(bookmark, headers);
        } catch (error) {
          console.error(error);
          setErrorFeaturedBookmark(error.message);
        } finally {
          setLoadingFeaturedBookmark(false);
        }

        // Fetch preferred jobs (initially page=1)
        // We do it here in case user has not changed filters yet
        fetchPreferredJobs(1);
      }

      fetchData();
    }
  }, [user, loading, router]);

  // Whenever we remove a filter (location/title), we reset page=1 and then re-fetch.
  // This effect will trigger whenever `locationFilter` or `titleFilter` changes.
  // We only fetch if user exists.
  useEffect(() => {
    if (user) {
      // If we changed either filter, re-fetch from page=1
      // but only if we've actually loaded the user
      fetchPreferredJobs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, titleFilter]);

  // Intersection Observer for infinite scroll
  const lastJobElementRef = useCallback(
    (node) => {
      if (loadingPreferredJobs) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            const nextPage = currentPage + 1;
            console.log('Loading more jobs... Page:', nextPage);
            setCurrentPage(nextPage);
          }
        },
        {
          root: null,
          rootMargin: '100px', // Start loading before reaching the end
          threshold: 0.1
        }
      );

      if (node) observer.current.observe(node);
    },
    [loadingPreferredJobs, hasMore, currentPage]
  );

  // When currentPage increases (via scroll) and we still have more,
  // fetch that next page
  useEffect(() => {
    if (currentPage > 1 && hasMore && !loadingPreferredJobs) {
      fetchPreferredJobs(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, hasMore]);

  // Render loading state
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoaderCircle className="animate-spin h-10 w-10 mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render authenticated content
  return user ? (
    <div className="container mx-auto py-0 p-6 max-w-4xl">
      <section className="mb-4">
        <h1 className="text-xl font-[family-name:var(--font-geist-sans)] font-medium mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          New jobs, saved searches, and more.
        </p>
      </section>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Featured Bookmark Section */}
        <Suspense fallback={<Skeleton />}>
          <Card className="border-none shadow-none col-span-2 lg:col-span-3 relative">
            <CardTitle className="mb-4">
              New Jobs Matching Your Searches
              {loadingSavedSearches && (
                <LoaderCircle
                  className="absolute bottom-3 right-0 animate-spin -mt-0.5 me-3 text-gray-600 inline-flex"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
              {errorSavedSearches && (
                <CircleAlert
                  className="absolute bottom-3 right-0 -mt-0.5 me-3 text-red-600 inline-flex opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
            </CardTitle>
            <CardDescription>
              <MatchingJobs loading={loadingMatchingJobs} error={errorMatchingJobs} />
            </CardDescription>
          </Card>
        </Suspense>

        {/* Featured Bookmark + Similar Jobs */}
        {featuredBookmark && (
          <Card className="border-none shadow-none col-span-2 lg:col-span-3 relative">
            <CardTitle className="mb-4">
              More jobs like your saved job
              {loadingFeaturedBookmark && <LoaderCircle className="absolute bottom-3 right-0 animate-spin" />}
            </CardTitle>
            <CardDescription>
              <JobList data={[featuredBookmark]} />
              {similarJobs.baseJob && similarJobs.similarJobs && (
                <JobList
                  data={similarJobs.similarJobs.filter(
                    (job) => job.id !== featuredBookmark.id
                  )}
                />
              )}
            </CardDescription>
          </Card>
        )}

        {/* Preferred Jobs Section */}
        {(user?.jobPrefsTitle || user?.jobPrefsLocation) ? (
          <Card className="border-none shadow-none col-span-2 lg:col-span-3 relative">
            <CardTitle className="mb-4">
              Jobs matching your preferences
              {loadingPreferredJobs && <LoaderCircle className="absolute bottom-3 right-0 animate-spin" />}
            </CardTitle>
            <CardDescription>
              {titleFilter && locationFilter ? (
                <p>
                  <strong>{titleFilter}</strong> in <strong>{locationFilter}</strong>
                </p>
              ) : titleFilter ? (
                <p>
                  <strong>{titleFilter}</strong>
                </p>
              ) : locationFilter ? (
                <p>
                  in <strong>{locationFilter}</strong>
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  (No active filters. Showing any jobs.)
                </p>
              )}
              <JobList
                data={preferredJobs}
                loading={loadingPreferredJobs}
                error={errorPreferredJobs}
                emptyMessage="No matching jobs found for your preferences."
                lastElementRef={lastJobElementRef}
              />
              {loadingPreferredJobs && (
                <div className="flex justify-center py-4">
                  <LoaderCircle className="animate-spin" />
                </div>
              )}
              {!hasMore && preferredJobs.length > 0 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  No more jobs to load
                </div>
              )}
            </CardDescription>
          </Card>
        ) : (
          <Card className="border-none shadow-none col-span-2 lg:col-span-3 relative">
            <CardTitle className="mb-4">Job Matches Unavailable</CardTitle>
            <CardDescription>
              <p className="mb-2">
                Your preferred job title and location are missing.
                Please update your profile to see matching jobs.
              </p>
              <Button variant="outline" onClick={() => router.push('/profile')}>
                Edit Profile
              </Button>
            </CardDescription>
          </Card>
        )}
      </div>
    </div>
  ) : null;
}
