"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { LoaderCircle, Plus } from 'lucide-react';
import { JobList } from "@/components/JobPostings";
import { Button } from '@/components/ui/button';
import { SavedSearchCard } from '../job-postings/saved-searches/page';

export default function SavedPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            const fetchSavedSearches = async () => {
                try {
                    const response = await fetch('/api/saved-searches', {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });

                    if (!response.ok) throw new Error('Failed to fetch bookmarked jobs');
                    const data = await response.json();
                    console.log(data.savedSearches);
                    setSavedSearches(data.savedSearches);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchSavedSearches();
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
        <div className="container mx-auto px-6 max-w-4xl">
            <section className="mb-4">
                <h1 className="text-lg font-[family-name:var(--font-geist-sans)] font-medium mb-1">
                    Agents
                </h1>
                <p className="text-sm text-muted-foreground">
                    View all the jobs you&apos;ve saved for later. Click on a job to view more details.
                </p>
            </section>
            <section>
                <h2 className="text-md font-[family-name:var(--font-geist-sans)] flex flex-row items-center justify-between font-medium mb-1">
                    Tasks
                    <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => redirect('/job-postings/saved-searches')}>
                    <Plus className="w-4 h-4" />
                    </Button>
                </h2>

                {savedSearches.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                    Create saved searches to deploy agents to find jobs on your behalf across the internet and on junera.
                                </p>
                ) : (
                    savedSearches.map((search) => (
                        <p className="text-muted-foreground" key={search.id}>
                        <strong className="text-foreground">{search?.search_criteria.title || 'Any'}</strong> jobs in <strong className="text-foreground">{search?.search_criteria.location || 'Any location'}</strong> requiring <strong className="text-foreground">{search?.search_criteria.experienceLevel || 'Any'}</strong> experience level.
                      </p>
                    ))
                )}
            </section>
        </div>
    );
}
