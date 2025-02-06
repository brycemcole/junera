"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { JobList } from '@/components/JobPostings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";

export default function JobHistoryPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("applied");

    // States for different job types
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [viewedJobs, setViewedJobs] = useState([]);

    // Loading states
    const [isLoadingApplied, setIsLoadingApplied] = useState(true);
    const [isLoadingSaved, setIsLoadingSaved] = useState(true);
    const [isLoadingViewed, setIsLoadingViewed] = useState(true);

    // Error states
    const [errorApplied, setErrorApplied] = useState(null);
    const [errorSaved, setErrorSaved] = useState(null);
    const [errorViewed, setErrorViewed] = useState(null);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else {
                // Fetch applied jobs
                const fetchAppliedJobs = async () => {
                    try {
                        const response = await fetch('/api/dashboard/applied-jobs', {
                            headers: { 'Authorization': `Bearer ${user.token}` },
                        });
                        const data = await response.json();
                        setAppliedJobs(data.appliedJobs || []);
                    } catch (error) {
                        setErrorApplied("Failed to load applied jobs");
                    } finally {
                        setIsLoadingApplied(false);
                    }
                };

                // Fetch saved jobs
                const fetchSavedJobs = async () => {
                    try {
                        const response = await fetch('/api/dashboard/bookmarked-jobs', {
                            headers: { 'Authorization': `Bearer ${user.token}` },
                        });
                        const data = await response.json();
                        setSavedJobs(data || []);
                    } catch (error) {
                        setErrorSaved("Failed to load saved jobs");
                    } finally {
                        setIsLoadingSaved(false);
                    }
                };

                // Fetch viewed jobs
                const fetchViewedJobs = async () => {
                    try {
                        const response = await fetch('/api/dashboard/recently-viewed', {
                            headers: { 'Authorization': `Bearer ${user.token}` },
                        });
                        const data = await response.json();
                        setViewedJobs(data || []);
                    } catch (error) {
                        setErrorViewed("Failed to load viewed jobs");
                    } finally {
                        setIsLoadingViewed(false);
                    }
                };

                fetchAppliedJobs();
                fetchSavedJobs();
                fetchViewedJobs();
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoaderCircle className="animate-spin h-6 w-6" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-0 p-6 max-w-4xl">
            <section className="mb-4">
                <h1 className="text-lg font-[family-name:var(--font-geist-sans)] font-medium mb-1">
                    Job History
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                    View your job application history, saved jobs, and recently viewed positions.
                </p>

                <Tabs defaultValue="applied" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="applied">
                            Applied
                            {!isLoadingApplied && <span className="ml-2 text-xs text-muted-foreground">({appliedJobs.length})</span>}
                        </TabsTrigger>
                        <TabsTrigger value="saved">
                            Saved
                            {!isLoadingSaved && <span className="ml-2 text-xs text-muted-foreground">({savedJobs.length})</span>}
                        </TabsTrigger>
                        <TabsTrigger value="viewed">
                            Viewed
                            {!isLoadingViewed && <span className="ml-2 text-xs text-muted-foreground">({viewedJobs.length})</span>}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="applied" className="mt-0">
                        <JobList
                            data={appliedJobs}
                            loading={isLoadingApplied}
                            error={errorApplied}
                            emptyMessage="You haven't applied to any jobs yet."
                        />
                    </TabsContent>

                    <TabsContent value="saved" className="mt-0">
                        <JobList
                            data={savedJobs}
                            loading={isLoadingSaved}
                            error={errorSaved}
                            emptyMessage="You haven't saved any jobs yet."
                        />
                    </TabsContent>

                    <TabsContent value="viewed" className="mt-0">

                        <JobList
                            data={viewedJobs}
                            loading={isLoadingViewed}
                            error={errorViewed}
                            emptyMessage="You haven't viewed any jobs yet."
                        />
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}
