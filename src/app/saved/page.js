"use client";
import { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            const fetchBookmarkedJobs = async () => {
                try {
                    const response = await fetch('/api/dashboard/bookmarked-jobs', {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });

                    if (!response.ok) throw new Error('Failed to fetch bookmarked jobs');
                    const data = await response.json();
                    setBookmarkedJobs(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchBookmarkedJobs();
        }
    }, [user, authLoading, router]);

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
        </div>
    );
}
