"use client";
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { JobList } from '@/components/JobPostings';
import axios from 'axios';

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (pageNum) => {
    if (!user?.token || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/api/notifications?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Transform notifications into job format
      const newJobs = response.data?.notifications.map(n => ({
        id: n.job_id, // Only use job_id from jobpostings table
        title: n.metadata.title,
        company: n.senderName,
        location: n.metadata.location,
        postedDate: n.createdAt,
        experienceLevel: n.metadata.experienceLevel,
        salary: n.metadata.salary,
        keywords: n.metadata.keywords,
        description: n.metadata.description
      })).filter(job => job.id) || []; // Filter out any notifications without valid job IDs

      const pagination = response.data?.pagination;

      if (pageNum === 1) {
        setJobs(newJobs);
      } else {
        setJobs(prev => [...prev, ...newJobs]);
      }

      setHasMore(pagination ? pageNum < pagination.totalPages : false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchNotifications(1);
    }
  }, [user, router, authLoading, fetchNotifications]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
      hasMore &&
      !isLoading
    ) {
      setPage(prev => prev + 1);
      fetchNotifications(page + 1);
    }
  }, [hasMore, isLoading, fetchNotifications, page]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="container mx-auto px-6 max-w-4xl">
      <section className="mb-4">
        <h1 className="text-lg font-[family-name:var(--font-geist-sans)] font-medium mb-1">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          View all your notifications here.
        </p>
      </section>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <JobList
        data={jobs}
        loading={isLoading}
        error={error}
      />
    </div>
  );
}
