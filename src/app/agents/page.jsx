"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { LoaderCircle, Plus, ThumbsUp, Trash2 } from 'lucide-react';
import { JobList } from '@/components/JobPostings';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillIndicator } from '@/components/pill';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AgentsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useState([]);
    const [matchedJobs, setMatchedJobs] = useState([]);
    const [agentTasks, setAgentTasks] = useState([]);
    const [agentNotes, setAgentNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newTask, setNewTask] = useState({
        search_title: '',
        search_location: '',
        search_experience_level: ''
    });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [loadingExplanation, setLoadingExplanation] = useState(null);
    const [detailedExplanation, setDetailedExplanation] = useState({});
    const [taskCounts, setTaskCounts] = useState({});
    const [sortBy, setSortBy] = useState('all');
    const [allNotes, setAllNotes] = useState([]);
    const [displayedNotes, setDisplayedNotes] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    // Memoize the filtered notes to avoid unnecessary recalculations
    const filteredNotes = React.useMemo(() => {
        return sortBy === 'all' 
            ? allNotes 
            : allNotes.filter(note => note.match_score.toLowerCase() === sortBy.toLowerCase());
    }, [allNotes, sortBy]);

    // Update getSortedNotes to use memoized filtered notes
    const getSortedNotes = React.useCallback(() => {
        // Calculate total pages based on filtered results
        const newTotalPages = Math.ceil(filteredNotes.length / limit);
        if (totalPages !== newTotalPages) {
            setTotalPages(newTotalPages);
        }
        
        // Get the current page of filtered results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return filteredNotes.slice(startIndex, endIndex);
    }, [filteredNotes, page, limit, totalPages]);

    // Add match counts getter using allNotes instead of agentNotes
    const getMatchCounts = () => {
        return {
            high: allNotes.filter(note => note.match_score.toLowerCase() === 'high').length,
            medium: allNotes.filter(note => note.match_score.toLowerCase() === 'medium').length,
            low: allNotes.filter(note => note.match_score.toLowerCase() === 'low').length,
            all: allNotes.length
        };
    };

    // Keep the original useEffect for less frequent updates
    useEffect(() => {
        if (!authLoading && user) {
            const fetchData = async () => {
                try {
                    const [searchesRes, tasksRes, countsRes] = await Promise.all([
                        fetch('/api/saved-searches', {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`,
                                'X-User-Id': user.id 
                            },
                        }),
                        fetch('/api/agent-tasks', {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`
                            },
                        }),
                        fetch('/api/agent-tasks/count', {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`
                            },
                        }),
                    ]);
    
                    if (!searchesRes.ok || !tasksRes.ok || !countsRes.ok) 
                        throw new Error('Failed to fetch data');
    
                    const [searchesData, tasksData, countsData] = await Promise.all([
                        searchesRes.json(),
                        tasksRes.json(),
                        countsRes.json(),
                    ]);
    
                    setSavedSearches(searchesData.savedSearches);
                    setAgentTasks(tasksData.tasks);
                    setTaskCounts(countsData.counts);
                } catch (err) {
                    setError(err.message);
                }
            };
    
            fetchData();
            const intervalId = setInterval(fetchData, 3 * 60 * 1000);
            return () => clearInterval(intervalId);
        }
    }, [user, authLoading]);

    // Update useEffect for frequent agent notes and counts updates
    useEffect(() => {
        if (!authLoading && user) {
            const fetchUpdates = async () => {
                try {
                    const [notesRes, countsRes] = await Promise.all([
                        fetch(`/api/agent-notes?page=${page}&limit=${limit}`, {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`
                            },
                        }),
                        fetch('/api/agent-tasks/count', {
                            headers: { 
                                'Authorization': `Bearer ${user.token}`
                            },
                        })
                    ]);

                    if (!notesRes.ok) throw new Error('Failed to fetch agent notes');
                    if (!countsRes.ok) throw new Error('Failed to fetch task counts');

                    const [notesData, countsData] = await Promise.all([
                        notesRes.json(),
                        countsRes.json()
                    ]);

                    setAgentNotes(notesData.data);
                    setTaskCounts(countsData.counts);
                } catch (err) {
                    console.error('Failed to fetch updates:', err);
                } finally {
                    setLoading(false);
                }
            };

            fetchUpdates();
            const updateIntervalId = setInterval(fetchUpdates, 10000); // 10 seconds
            return () => clearInterval(updateIntervalId);
        }
    }, [user, authLoading, page, limit]);

    // Update useEffect to fetch all notes
    useEffect(() => {
        if (!authLoading && user) {
            const fetchAllNotes = async () => {
                try {
                    const response = await fetch('/api/agent-notes/all', {
                        headers: { 
                            'Authorization': `Bearer ${user.token}`
                        },
                    });

                    if (!response.ok) throw new Error('Failed to fetch agent notes');

                    const data = await response.json();
                    setAllNotes(data.data);
                } catch (err) {
                    console.error('Failed to fetch all notes:', err);
                }
            };

            fetchAllNotes();
            const updateIntervalId = setInterval(fetchAllNotes, 10000); // 10 seconds
            return () => clearInterval(updateIntervalId);
        }
    }, [user, authLoading]);

    // Update the effect to handle pagination updates more efficiently
    useEffect(() => {
        const paginatedNotes = getSortedNotes();
        setDisplayedNotes(paginatedNotes);
        
        // If current page is beyond total pages, reset to page 1
        if (page > totalPages && totalPages > 0) {
            setPage(1);
        }
    }, [filteredNotes, page, getSortedNotes, totalPages]);

    // Reset page when changing sort
    useEffect(() => {
        setPage(1);
    }, [sortBy]);

    const handleCreateTask = async () => {
        try {
            const res = await fetch('/api/agent-tasks', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            });

            if (!res.ok) throw new Error('Failed to create task');

            const data = await res.json();
            setAgentTasks([data.task, ...agentTasks]);
            toast.success('Agent task created successfully');
            setNewTask({ search_title: '', search_location: '', search_experience_level: '' });
        } catch (err) {
            toast.error('Failed to create agent task');
            console.error(err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const res = await fetch(`/api/agent-tasks?taskId=${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to delete task');

            setAgentTasks(agentTasks.filter(task => task.id !== taskId));
            toast.success('Agent task deleted successfully');
        } catch (err) {
            toast.error('Failed to delete agent task');
            console.error(err);
        }
    };

    const handleExplainFurther = async (noteId) => {
        try {
            setLoadingExplanation(noteId);
            // Reset the explanation state for this note when starting a new request
            setDetailedExplanation(prev => ({
                ...prev,
                [noteId]: ''
            }));

            const response = await fetch(`/api/agent-notes/${noteId}/explain`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to get detailed explanation');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedExplanation = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedExplanation += parsed.content;
                                setDetailedExplanation(prev => ({
                                    ...prev,
                                    [noteId]: accumulatedExplanation
                                }));
                            }
                        } catch (err) {
                            console.error('Error parsing chunk:', err);
                        }
                    }
                }
            }
        } catch (err) {
            toast.error('Failed to get detailed explanation');
            console.error(err);
            // Reset the loading state and clear any partial content on error
            setDetailedExplanation(prev => ({
                ...prev,
                [noteId]: ''
            }));
        } finally {
            setLoadingExplanation(null);
        }
    };

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
        <div className="container mx-auto px-6 max-w-6xl">
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
                    Agent Tasks
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-accent">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Agent Task</DialogTitle>
                                <DialogDescription>
                                    Create a new agent task to automatically analyze jobs matching your criteria.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Job Title</Label>
                                    <Input
                                        id="title"
                                        value={newTask.search_title}
                                        onChange={(e) => setNewTask({...newTask, search_title: e.target.value})}
                                        placeholder="e.g. Software Engineer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={newTask.search_location}
                                        onChange={(e) => setNewTask({...newTask, search_location: e.target.value})}
                                        placeholder="e.g. San Francisco"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Experience Level</Label>
                                    <Input
                                        id="experience"
                                        value={newTask.search_experience_level}
                                        onChange={(e) => setNewTask({...newTask, search_experience_level: e.target.value})}
                                        placeholder="e.g. Entry Level"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <DialogClose asChild>
                                    <Button onClick={handleCreateTask}>Create Task</Button>
                                </DialogClose>
                            </div>
                        </DialogContent>
                    </Dialog>
                </h2>

                {agentTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No agent tasks created yet. Create one to start analyzing jobs automatically.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {agentTasks.map((task) => (
                            <Card key={task.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">{task.search_title || 'Any Title'}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {task.search_location || 'Any Location'} • {task.search_experience_level || 'Any Level'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline"> 
                                                <PillIndicator variant="success" pulse />
                                                <span className="ml-2">

                                             Active
                                             </span>
                                             </Badge>
                                             <Badge variant="outline"> 
                                            Processed {taskCounts[task.id] || 0} jobs
                                                </Badge>
                                                </div>  
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-md font-[family-name:var(--font-geist-sans)] font-medium">
                            Agent Notes
                        </h2>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by match..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All Matches <Badge variant="secondary" className="ml-2">{getMatchCounts().all}</Badge>
                            </SelectItem>
                            <SelectItem value="high">
                                High Matches <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-700">{getMatchCounts().high}</Badge>
                            </SelectItem>
                            <SelectItem value="medium">
                                Medium Matches <Badge variant="secondary" className="ml-2 bg-yellow-500/10 text-yellow-700">{getMatchCounts().medium}</Badge>
                            </SelectItem>
                            <SelectItem value="low">
                                Low Matches <Badge variant="secondary" className="ml-2 bg-orange-500/10 text-orange-700">{getMatchCounts().low}</Badge>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {sortBy !== 'all' && (
                    <div className="mb-4">
                            <Badge className={`${
                                sortBy === 'high' ? 'bg-green-500/10 text-green-700 border-green-500' :
                                sortBy === 'medium' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500' :
                                'bg-orange-500/10 text-orange-700 border-orange-500'
                            }`}>
                                {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} Matches Only
                            </Badge>
                            </div>
                        )}

                {displayedNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No agent notes found.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {displayedNotes.map((note) => (
                            <Card key={note.id} className={`p-4 ${
                                note.match_score === 'High' ? 'border-green-500/30 bg-green-500/10' :
                                note.match_score === 'Medium' ? 'border-yellow-500/30 bg-yellow-500/10' :
                                'border-orange-500/30 bg-orange-500/10'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="w-full">
                                        <h3 className="font-medium">{note.job_title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {note.company} • {note.location}
                                        </p>
                                        <p className="text-sm mt-2">
                                            {note.explanation}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => {
                                                        if (!detailedExplanation[note.id]) {
                                                            handleExplainFurther(note.id);
                                                        }
                                                    }}
                                                >
                                                    {loadingExplanation === note.id ? (
                                                        <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        'Get Detailed Analysis'
                                                    )}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-[800px] [&>button:last-child]:hidden">
                                                <ScrollArea className="flex max-h-full flex-col overflow-hidden">
                                                    <DialogHeader className="contents space-y-0 text-left">
                                                        <DialogTitle className="px-6 pt-6">Job Match Analysis</DialogTitle>
                                                        <DialogDescription asChild>
                                                            <div className="p-6">
                                                                <div className="prose prose-sm max-w-none dark:prose-invert [&_h2]:text-foreground [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_p]:text-muted-foreground">
                                                                    {loadingExplanation === note.id && !detailedExplanation[note.id] ? (
                                                                        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                                                            <LoaderCircle className="w-4 h-4 animate-spin" />
                                                                            <span>Analyzing your profile match...</span>
                                                                        </div>
                                                                    ) : null}
                                                                    {detailedExplanation[note.id] ? (
                                                                        <ReactMarkdown>
                                                                            {detailedExplanation[note.id]}
                                                                        </ReactMarkdown>
                                                                    ) : !loadingExplanation ? (
                                                                        <div className="text-muted-foreground">
                                                                            Click &quot;Get Detailed Analysis&quot; to see an in-depth breakdown of your match with this role.
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 sm:justify-start">
                                                        <DialogClose asChild>
                                                            <Button type="button" variant="outline">
                                                                Close
                                                            </Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => router.push(`/job-postings/${note.job_id}`)}
                                        >
                                            View Job
                                        </Button>
                                        </div> 
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center mt-4">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => {
                            setPage(prev => Math.max(prev - 1, 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Previous
                    </Button>
                    <div className="flex flex-col items-center text-sm text-muted-foreground">
                        <span>Page {page} of {totalPages}</span>
                        <span>Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, filteredNotes.length)} of {filteredNotes.length} {sortBy !== 'all' ? `${sortBy} matches` : 'matches'}</span>
                    </div>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => {
                            setPage(prev => prev + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Next
                    </Button>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-md font-[family-name:var(--font-geist-sans)] flex flex-row items-center justify-between font-medium mb-4">
                    Processed Jobs
                    <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => router.push('/job-postings/saved-searches')}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </h2>
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
                            <Card key={match.match_id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{match.title}</h3>
                                    <div className="text-sm text-muted-foreground">
                                        Match criteria: {match.search_title}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {match.company} • {match.location}
                                </p>
                                <p className="text-sm">{match.latest_note}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
