"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BookmarkedJobs from '@/components/BookmarkedJobs';
import { LoaderCircle } from 'lucide-react';
import { JobList } from "@/components/JobPostings";

export default function SavedPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const sentinelRef = useRef(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            const fetchBookmarkedJobs = async () => {
                try {
                    const response = await fetch(`/api/dashboard/bookmarked-jobs?page=${currentPage}`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });

                    if (!response.ok) throw new Error('Failed to fetch bookmarked jobs');
                    const data = await response.json();
                    setBookmarkedJobs((prevData) => [...prevData, ...data]);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchBookmarkedJobs();
        }
    }, [user, authLoading, router, currentPage]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setCurrentPage((prevPage) => prevPage + 1);
            }
        });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoaderCircle className="animate-spin h-6 w-6" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-2xl font-medium mb-6">Saved Jobs</h1>
            <BookmarkedJobs
                jobs={bookmarkedJobs}
                loading={loading}
                error={error}
            />
            <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
    );
}
