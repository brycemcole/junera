"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { LoaderCircle, Plus, ThumbsUp } from 'lucide-react';
import { JobList } from "@/components/JobPostings";
import { Button } from '@/components/ui/button';
import { SavedSearchCard } from '../job-postings/saved-searches/page';
import { Card } from "@/components/ui/card";

export default function AgentsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useState([]);
    const [matchedJobs, setMatchedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && user) {
            const fetchData = async () => {
                try {
                    const [searchesRes, matchesRes] = await Promise.all([
                        fetch('/api/saved-searches', {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`,
                                'X-User-Id': user.id 
                            },
                        }),
                        fetch('/api/agent-matches', {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`,
                                'X-User-Id': user.id 
                            },
                        })
                    ]);

                    if (!searchesRes.ok || !matchesRes.ok) 
                        throw new Error('Failed to fetch data');

                    const searchesData = await searchesRes.json();
                    const matchesData = await matchesRes.json();

                    setSavedSearches(searchesData.savedSearches);
                    setMatchedJobs(matchesData.matches);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoaderCircle className="animate-spin h-6 w-6" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="container mx-auto px-6 max-w-4xl">
            <section className="mb-8">
                <h1 className="text-lg font-[family-name:var(--font-geist-sans)] font-medium mb-1">
                    AI Job Agents
                </h1>
                <p className="text-sm text-muted-foreground">
                    Your AI agents analyze jobs and match them to your profile. Here are your active searches and matched jobs.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-md font-[family-name:var(--font-geist-sans)] flex flex-row items-center justify-between font-medium mb-4">
                    Active Searches
                    <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => router.push('/job-postings/saved-searches')}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </h2>

                {savedSearches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Create saved searches to deploy agents to find jobs on your behalf across the internet and on junera.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {savedSearches.map((search) => (
                            <Card key={search.id} className="p-4">
                                <p className="text-sm">
                                    Searching for <strong>{search?.search_criteria.title || 'Any'}</strong> jobs 
                                    in <strong>{search?.search_criteria.location || 'Any location'}</strong> 
                                    requiring <strong>{search?.search_criteria.experienceLevel || 'Any'}</strong> experience level.
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-md font-[family-name:var(--font-geist-sans)] font-medium mb-4 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    Matched Jobs
                </h2>

                {matchedJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No job matches found yet. Your agents will analyze new jobs as they come in.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {matchedJobs.map((match) => (
                            <Card key={match.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{match.title}</h3>
                                    <span className="text-sm text-green-600">
                                        {Math.round(match.confidence_score * 100)}% Match
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {match.company} • {match.location}
                                </p>
                                <p className="text-sm">{match.match_reason}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
