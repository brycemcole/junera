"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { LoaderCircle, Plus, ThumbsUp, Trash2 } from 'lucide-react';
import { JobList } from "@/components/JobPostings";
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillIndicator } from '@/components/pill';
import { Badge } from '@/components/ui/badge';

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
            // If we already have the explanation in state, just return
            if (detailedExplanation[noteId]) {
                return;
            }

            setLoadingExplanation(noteId);
            const res = await fetch(`/api/agent-notes/${noteId}/explain`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to get detailed explanation');

            const data = await res.json();
            setDetailedExplanation(prev => ({
                ...prev,
                [noteId]: data.detailed
            }));
        } catch (err) {
            toast.error('Failed to get detailed explanation');
            console.error(err);
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
                <h2 className="text-md font-[family-name:var(--font-geist-sans)] flex flex-row items-center justify-between font-medium mb-4">
                    Agent Notes
                    </h2>
                {agentNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No agent notes found.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {agentNotes.map((note) => (
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
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Detailed Job Match Analysis</DialogTitle>
                                                    <DialogDescription>
                                                        In-depth breakdown of your fit for this role
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4 space-y-4">
                                                    {loadingExplanation === note.id ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <LoaderCircle className="w-6 h-6 animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-sm max-w-none">
                                                            {detailedExplanation[note.id]?.split('\n').map((paragraph, i) => (
                                                                <p key={i} className="mb-4 text-foreground" dangerouslySetInnerHTML={{ __html: paragraph }} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
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
                            setPage(prev => Math.max(prev - 1, 1))
                            // scroll to top
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Previous
                    </Button>
                    <span>Page {page}</span>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPage(prev => prev + 1)
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
