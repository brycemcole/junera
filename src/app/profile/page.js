"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleAlert, Edit2, LoaderCircle, PlusCircle, X } from 'lucide-react';
import EditProfileDialog from '@/components/edit-profile'
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import Link from 'next/link';
import { Github } from "lucide-react";

function formatStartDate(date, locale = enUS) {
    try {
        return format(new Date(date), 'MMMM yyyy', { locale });
    } catch (error) {
        console.error('Invalid date:', date);
        return 'Invalid Date';
    }
}
const calculateDuration = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : new Date();

    const years = differenceInYears(end, start);
    const months = differenceInMonths(end, start) % 12;

    let duration = "";
    if (years > 0) {
        duration += `${years} year${years > 1 ? "s" : ""}`;
    }
    if (months > 0) {
        if (duration) duration += ", ";
        duration += `${months} month${months > 1 ? "s" : ""}`;
    }
    if (!duration) {
        duration = "Less than a month";
    }

    return duration;
};

function ExperienceAvatar({ image, username }) {
    return (
        <Avatar className="rounded-lg">
            <AvatarImage src={image} alt={`${username}'s avatar`} />
            <AvatarFallback>KK</AvatarFallback>
        </Avatar>
    );
}

function CancelDialog({ experience, onConfirm }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <X size={14} />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{experience.institution_name || experience.job_title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Do you really want to delete this experience?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const handleGitHubLink = (e) => {
    const userId = e.target.getAttribute('data-user-id');
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const returnUrl = encodeURIComponent(`https://dev.junera.us/api/login/github?mode=link&userId=${userId}`);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${returnUrl}`;
};

function GitHubSection({ githubUser, onLink }) {
    const { user, loading } = useAuth();
    console.log(user);
    return (
        <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">GitHub Account</h3>
            {githubUser ? (
                <div className="flex items-center gap-2">
                    <Github size={20} />
                    <span>Connected as <strong>{githubUser}</strong></span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => onLink(null)}
                    >
                        Disconnect
                    </Button>
                </div>
            ) : (
                !loading && user && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            data-user-id={user.id}
                            onClick={handleGitHubLink}
                        >
                            <Github className="mr-2 h-4 w-4" />
                            Connect GitHub Account
                        </Button>
                    </div>
                )
            )}
        </div>
    );
}

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    const profileFields = [
        {
            type: 'text',
            name: 'full_name',
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true
        },
        {
            type: 'textarea',
            name: 'headline',
            label: 'Headline',
            placeholder: 'Write a brief headline about yourself'
        },
        {
            type: 'email',
            name: 'email',
            label: 'Email',
            required: true
        },
        {
            type: 'tel',
            name: 'phone_number',
            label: 'Phone Number'
        },
        {
            type: 'multiselect',
            name: 'job_prefs_title',
            label: 'Desired Job Titles',
            placeholder: 'Select job titles',
            options: [
                { value: 'Software Engineer', label: 'Software Engineer' },
                { value: 'Frontend Developer', label: 'Frontend Developer' },
                { value: 'Backend Developer', label: 'Backend Developer' },
                { value: 'Full Stack Developer', label: 'Full Stack Developer' },
                { value: 'DevOps Engineer', label: 'DevOps Engineer' },
                { value: 'Project Manager', label: 'Project Manager' },
                // Add more options as needed
            ]
        },
        {
            type: 'multiselect',
            name: 'job_prefs_location',
            label: 'Preferred Locations',
            placeholder: 'Select preferred locations',
            options: [
                { value: 'New York', label: 'New York' },
                { value: 'San Francisco', label: 'San Francisco' },
                { value: 'Remote', label: 'Remote' },
                // Add more location options as needed
            ]
        },
        {
            type: 'text',
            name: 'job_prefs_industry',
            label: 'Preferred Industry',
            placeholder: 'e.g. Technology, Finance'
        },
        {
            type: 'text',
            name: 'job_prefs_language',
            label: 'Preferred Language',
            placeholder: 'e.g. English'
        },
        {
            type: 'multiselect',
            name: 'job_prefs_level',
            label: 'Experience Level',
            options: [
                { value: 'Internship', label: 'Internship' },
                { value: 'Entry Level', label: 'Entry Level' },
                { value: 'Mid Level', label: 'Mid Level' },
                { value: 'Senior Level', label: 'Senior Level' },
                { value: 'Lead', label: 'Lead' },
                { value: 'Manager', label: 'Manager' }
            ]
        },
        {
            type: 'number',
            name: 'job_prefs_salary',
            label: 'Expected Salary (Annual)',
            placeholder: 'Enter expected salary'
        },
        {
            type: 'boolean',
            name: 'job_prefs_relocatable',
            label: 'Willing to Relocate'
        }
    ];

    const experienceFields = [
        {
            type: 'text',
            name: 'job_title',
            label: 'Job Title',
            placeholder: 'Enter job title',
            required: true
        },
        {
            type: 'text',
            name: 'company_name',
            label: 'Company',
            placeholder: 'Enter company name',
            required: true
        },
        {
            type: 'text',
            name: 'location',
            label: 'Location',
            placeholder: 'Enter location'
        },
        {
            type: 'text',
            name: 'start_date',
            label: 'Start Date',
            type: 'date',
            required: true
        },
        {
            type: 'text',
            name: 'end_date',
            label: 'End Date',
            type: 'date'
        },
        {
            type: 'boolean',
            name: 'is_current',
            label: 'I currently work here'
        },
        {
            type: 'textarea',
            name: 'description',
            label: 'Description',
            placeholder: 'Describe your responsibilities and achievements'
        }
    ];

    const educationFields = [
        {
            type: 'text',
            name: 'institution_name',
            label: 'Institution',
            placeholder: 'Enter school name',
            required: true
        },
        {
            type: 'text',
            name: 'degree',
            label: 'Degree',
            placeholder: 'Enter degree',
            required: true
        },
        {
            type: 'text',
            name: 'field_of_study',
            label: 'Field of Study',
            placeholder: 'Enter field of study',
            required: true
        },
        {
            type: 'text',
            name: 'start_date',
            label: 'Start Date',
            type: 'date',
            required: true
        },
        {
            type: 'text',
            name: 'end_date',
            label: 'End Date',
            type: 'date'
        },
        {
            type: 'boolean',
            name: 'is_current',
            label: 'I currently study here'
        },
        {
            type: 'textarea',
            name: 'description',
            label: 'Description',
            placeholder: 'Describe your studies and achievements'
        }
    ];

    const projectFields = [
        {
            type: 'text',
            name: 'project_name',
            label: 'Project Name',
            placeholder: 'Enter project name',
            required: true
        },
        {
            type: 'text',
            name: 'start_date',
            label: 'Start Date',
            type: 'date',
            required: true
        },
        {
            type: 'text',
            name: 'end_date',
            label: 'End Date',
            type: 'date'
        },
        {
            type: 'boolean',
            name: 'is_current',
            label: 'This is a current project'
        },
        {
            type: 'textarea',
            name: 'description',
            label: 'Description',
            placeholder: 'Describe your project'
        },
        {
            type: 'text',
            name: 'technologies_used',
            label: 'Technologies Used',
            placeholder: 'List technologies used'
        },
        {
            type: 'text',
            name: 'project_url',
            label: 'Project URL',
            placeholder: 'Project website or repository'
        }
    ];

    const certificationFields = [
        {
            type: 'text',
            name: 'certification_name',
            label: 'Certification Name',
            placeholder: 'Enter certification name',
            required: true
        },
        {
            type: 'text',
            name: 'issuing_organization',
            label: 'Issuing Organization',
            placeholder: 'Enter organization name',
            required: true
        },
        {
            type: 'text',
            name: 'issue_date',
            label: 'Issue Date',
            type: 'date',
            required: true
        },
        {
            type: 'text',
            name: 'expiration_date',
            label: 'Expiration Date',
            type: 'date'
        },
        {
            type: 'text',
            name: 'credential_id',
            label: 'Credential ID',
            placeholder: 'Enter credential ID'
        },
        {
            type: 'text',
            name: 'credential_url',
            label: 'Credential URL',
            placeholder: 'Enter credential URL'
        }
    ];

    const awardFields = [
        {
            type: 'text',
            name: 'award_name',
            label: 'Award Name',
            placeholder: 'Enter award name',
            required: true
        },
        {
            type: 'text',
            name: 'award_issuer',
            label: 'Award Issuer',
            placeholder: 'Enter issuer name',
            required: true
        },
        {
            type: 'text',
            name: 'award_date',
            label: 'Award Date',
            type: 'date',
            required: true
        },
        {
            type: 'text',
            name: 'award_url',
            label: 'Award URL',
            placeholder: 'Enter award URL'
        },
        {
            type: 'text',
            name: 'award_id',
            label: 'Award ID',
            placeholder: 'Enter award ID'
        },
        {
            type: 'textarea',
            name: 'award_description',
            label: 'Description',
            placeholder: 'Describe the award'
        }
    ];

    const handleProfileUpdate = async (formData) => {
        try {
            // Ensure all array fields are properly formatted
            const processedData = {
                ...formData,
                job_prefs_title: formData.job_prefs_title
                    ? (Array.isArray(formData.job_prefs_title)
                        ? formData.job_prefs_title
                        : [formData.job_prefs_title])
                    : [],
                job_prefs_location: formData.job_prefs_location
                    ? (Array.isArray(formData.job_prefs_location)
                        ? formData.job_prefs_location
                        : [formData.job_prefs_location])
                    : [],
                job_prefs_level: formData.job_prefs_level
                    ? (Array.isArray(formData.job_prefs_level)
                        ? formData.job_prefs_level
                        : [formData.job_prefs_level])
                    : [],
                job_prefs_salary: formData.job_prefs_salary
                    ? parseInt(formData.job_prefs_salary, 10)
                    : null,
                job_prefs_relocatable: Boolean(formData.job_prefs_relocatable)
            };

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast({
                    title: 'Error',
                    description: errorData.error || 'Failed to update profile',
                    variant: 'destructive'
                });
                throw new Error('Failed to update profile');
            }

            const { user: updatedUser } = await response.json();
            setProfile(prev => ({
                ...prev,
                user: updatedUser
            }));
            toast({
                title: 'Success',
                description: 'Profile updated successfully'
            });

        } catch (err) {
            console.error('Error updating profile:', err);
            toast({
                title: 'Error',
                description: 'Failed to update profile',
                variant: 'destructive'
            });
        }
    };

    const handleExperienceAdd = async (formData) => {
        try {
            const response = await fetch('/api/user/experience', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to add experience');

            const newExp = await response.json();
            setProfile(prev => ({
                ...prev,
                experience: [...(prev.experience || []), { ...formData, id: newExp.id }]
            }));
            toast({ title: 'Success', description: 'Experience added successfully' });
        } catch (err) {
            console.error('Error adding experience:', err);
            toast({ title: 'Error', description: 'Failed to add experience', variant: 'destructive' });
        }
    };

    const handleExperienceEdit = async (id, formData) => {
        try {
            const response = await fetch('/api/user/experience', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, ...formData }),
            });

            if (!response.ok) throw new Error('Failed to update experience');

            setProfile(prev => ({
                ...prev,
                experience: prev.experience.map(exp =>
                    exp.id === id ? { ...formData, id } : exp
                )
            }));
            toast({ title: 'Success', description: 'Experience updated successfully' });
        } catch (err) {
            console.error('Error updating experience:', err);
            toast({ title: 'Error', description: 'Failed to update experience', variant: 'destructive' });
        }
    };

    const handleExperienceDelete = async (id) => {
        try {
            const response = await fetch('/api/user/experience', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error('Failed to delete experience');

            setProfile(prev => ({
                ...prev,
                experience: prev.experience.filter(exp => exp.id !== id)
            }));
            toast({ title: 'Success', description: 'Experience deleted successfully' });
        } catch (err) {
            console.error('Error deleting experience:', err);
            toast({ title: 'Error', description: 'Failed to delete experience', variant: 'destructive' });
        }
    };

    const handleEducationAdd = async (formData) => {
        try {
            const response = await fetch('/api/user/education', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to add education');

            const newEdu = await response.json();
            setProfile(prev => ({
                ...prev,
                education: [...(prev.education || []), { ...formData, id: newEdu.id }]
            }));
            toast({ title: 'Success', description: 'Education added successfully' });
        } catch (err) {
            console.error('Error adding education:', err);
            toast({ title: 'Error', description: 'Failed to add education', variant: 'destructive' });
        }
    };

    const handleEducationEdit = async (id, formData) => {
        try {
            const response = await fetch('/api/user/education', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, ...formData }),
            });

            if (!response.ok) throw new Error('Failed to update education');

            setProfile(prev => ({
                ...prev,
                education: prev.education.map(edu =>
                    edu.id === id ? { ...formData, id } : edu
                )
            }));
            toast({ title: 'Success', description: 'Education updated successfully' });
        } catch (err) {
            console.error('Error updating education:', err);
            toast({ title: 'Error', description: 'Failed to update education', variant: 'destructive' });
        }
    };

    const handleEducationDelete = async (id) => {
        try {
            const response = await fetch('/api/user/education', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error('Failed to delete education');

            setProfile(prev => ({
                ...prev,
                education: prev.education.filter(edu => edu.id !== id)
            }));
            toast({ title: 'Success', description: 'Education deleted successfully' });
        } catch (err) {
            console.error('Error deleting education:', err);
            toast({ title: 'Error', description: 'Failed to delete education', variant: 'destructive' });
        }
    };

    const handleProjectAdd = async (formData) => {
        try {
            const response = await fetch('/api/user/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to add project');

            const newProj = await response.json();
            setProfile(prev => ({
                ...prev,
                projects: [...(prev.projects || []), { ...formData, id: newProj.id }]
            }));
            toast({ title: 'Success', description: 'Project added successfully' });
        } catch (err) {
            console.error('Error adding project:', err);
            toast({ title: 'Error', description: 'Failed to add project', variant: 'destructive' });
        }
    };

    const handleProjectEdit = async (id, formData) => {
        try {
            const response = await fetch('/api/user/projects', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, ...formData }),
            });

            if (!response.ok) throw new Error('Failed to update project');

            setProfile(prev => ({
                ...prev,
                projects: prev.projects.map(proj =>
                    proj.id === id ? { ...formData, id } : proj
                )
            }));
            toast({ title: 'Success', description: 'Project updated successfully' });
        } catch (err) {
            console.error('Error updating project:', err);
            toast({ title: 'Error', description: 'Failed to update project', variant: 'destructive' });
        }
    };

    const handleProjectDelete = async (id) => {
        try {
            const response = await fetch('/api/user/projects', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error('Failed to delete project');

            setProfile(prev => ({
                ...prev,
                projects: prev.projects.filter(proj => proj.id !== id)
            }));
            toast({ title: 'Success', description: 'Project deleted successfully' });
        } catch (err) {
            console.error('Error deleting project:', err);
            toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
        }
    };

    const handleCertificationAdd = async (formData) => {
        try {
            const response = await fetch('/api/user/certifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to add certification');

            const newCert = await response.json();
            setProfile(prev => ({
                ...prev,
                certifications: [...(prev.certifications || []), { ...formData, id: newCert.id }]
            }));
            toast({ title: 'Success', description: 'Certification added successfully' });
        } catch (err) {
            console.error('Error adding certification:', err);
            toast({ title: 'Error', description: 'Failed to add certification', variant: 'destructive' });
        }
    };

    const handleAwardAdd = async (formData) => {
        try {
            const response = await fetch('/api/user/awards', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to add award');

            const newAward = await response.json();
            setProfile(prev => ({
                ...prev,
                awards: [...(prev.awards || []), { ...formData, id: newAward.id }]
            }));
            toast({ title: 'Success', description: 'Award added successfully' });
        } catch (err) {
            console.error('Error adding award:', err);
            toast({ title: 'Error', description: 'Failed to add award', variant: 'destructive' });
        }
    };

    const sortExperiences = (experiences) => {
        if (!experiences || !Array.isArray(experiences)) return [];

        // Step 1: Assign each company a unique index based on first occurrence
        const companyOrderMap = new Map();
        let currentIndex = 0;
        experiences.forEach(exp => {
            if (!companyOrderMap.has(exp.company_name)) {
                companyOrderMap.set(exp.company_name, currentIndex++);
            }
        });

        // Step 2: Sort the experiences
        return experiences.sort((a, b) => {
            // a. Compare based on company order
            const companyOrderA = companyOrderMap.get(a.company_name);
            const companyOrderB = companyOrderMap.get(b.company_name);

            if (companyOrderA !== companyOrderB) {
                return companyOrderA - companyOrderB;
            }

            // b. Within the same company, prioritize current positions
            if (a.is_current !== b.is_current) {
                return a.is_current ? -1 : 1;
            }

            // c. Finally, sort by start date ascending
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);

            return dateA - dateB;
        });
    };

    const sortEducation = (education) => {
        return education?.sort((a, b) => {
            // First sort by current status
            if (a.is_current !== b.is_current) {
                return a.is_current ? -1 : 1;
            }
            // Then by institution name
            if (a.institution_name !== b.institution_name) {
                return a.institution_name.localeCompare(b.institution_name);
            }
            // Finally by start date
            return new Date(b.start_date) - new Date(a.start_date);
        });
    };

    const sortByDate = (items) => {
        return items?.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            const fetchProfile = async () => {
                try {
                    const response = await fetch('/api/user/profile', {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });

                    console.log(response)

                    if (!response.ok) {
                        throw new Error('Failed to fetch profile');
                    }

                    const data = await response.json();
                    setProfile(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchProfile();
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="container mx-auto py-0 px-6 max-w-4xl">
            <section className="mb-4">
                <h1 className="text-xl font-[family-name:var(--font-geist-mono)] font-medium mb-1">
                    Profile
                </h1>
                <p className="text-sm text-muted-foreground">
                    View and edit your profile information.
                </p>

            </section>

            {/* Personal Information */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profile.user.avatar_url} />
                            <AvatarFallback>{profile.user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-medium">{profile.user.full_name}</h2>
                            {profile.user.headline && (
                                <p className="text-muted-foreground">{profile.user.headline}</p>
                            )}
                        </div>
                    </div>
                    <EditProfileDialog
                        fields={profileFields}
                        initialData={profile?.user}
                        onSubmit={handleProfileUpdate}
                        title={<Edit2 size={12} />}
                    />
                </div>
                {profile.user.email && (
                    <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                )}
            </div>

            {/* Job Preferences */}
            {(profile.user.job_prefs_title || profile.user.job_prefs_location || profile.user.job_prefs_level || profile.user.job_prefs_salary) && (
                <div className="mb-8">
                    <h2 className="text-md font-semibold mb-4">Job Preferences <small className="float-right text-muted-foreground">Only visible to you</small></h2>
                    <p className="text-sm text-muted-foreground">
                        Looking for {profile.user.job_prefs_title || 'any'} positions
                        {profile.user.job_prefs_location ? ` in ${profile.user.job_prefs_location}` : ''}
                        {profile.user.job_prefs_level ? ` at ${profile.user.job_prefs_level} level` : ''}
                        {profile.user.job_prefs_salary ? ` with compensation around ${profile.user.job_prefs_salary}` : ''}.
                        {profile.user.job_prefs_relocatable && ' Open to relocation.'}
                    </p>
                </div>
            )}

            {/* Work Experience */}
            {profile.experience && profile.experience.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-md font-semibold">Experience</h2>
                        <EditProfileDialog
                            fields={experienceFields}
                            onSubmit={handleExperienceAdd}
                            title={<PlusCircle size={14} />}
                        />
                    </div>
                    <div className="space-y-6">
                        {sortExperiences(profile.experience)?.map((exp) => (
                            <div key={exp.id} className="group relative">
                                <div className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <EditProfileDialog
                                        fields={experienceFields}
                                        initialData={exp}
                                        onSubmit={(formData) => handleExperienceEdit(exp.id, formData)}
                                        title={<Edit2 size={14} />}
                                    />
                                    <CancelDialog experience={exp} onConfirm={() => handleExperienceDelete(exp.id)} />
                                </div>
                                <div className="flex gap-4">
                                    <ExperienceAvatar
                                        image={`https://logo.clearbit.com/${encodeURIComponent(exp.company_name.replace('.com', ''))}.com`}
                                        username={exp.company_name}
                                    />
                                    <div>
                                        <h3 className="font-medium">{exp.job_title}</h3>
                                        <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {exp.is_current
                                                ? `${formatStartDate(exp.start_date)} - Present`
                                                : `${formatStartDate(exp.start_date)} - ${formatStartDate(exp.end_date)} · ${calculateDuration(exp.start_date, exp.end_date)}`
                                            }
                                        </p>
                                        {exp.description && (
                                            <p className="mt-2 text-sm">{exp.description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-md font-semibold">Education</h2>
                        <EditProfileDialog
                            fields={educationFields}
                            onSubmit={handleEducationAdd}
                            title={<PlusCircle size={14} />}
                        />
                    </div>
                    <div className="space-y-6">
                        {sortEducation(profile.education)?.map((edu) => (
                            <div key={edu.id} className="group relative">
                                <div className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <EditProfileDialog
                                        fields={educationFields}
                                        initialData={edu}
                                        onSubmit={(formData) => handleEducationEdit(edu.id, formData)}
                                        title={<Edit2 size={14} />}
                                    />
                                    <CancelDialog experience={edu} onConfirm={() => handleEducationDelete(edu.id)} />
                                </div>
                                <h3 className="font-medium">{edu.institution_name}</h3>
                                <p className="text-sm">{edu.degree} in {edu.field_of_study}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatStartDate(edu.start_date)} - {edu.is_current ? 'Present' : formatStartDate(edu.end_date)}
                                </p>
                                {edu.description && (
                                    <p className="mt-2 text-sm">{edu.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-md font-semibold">Projects</h2>
                        <EditProfileDialog
                            fields={projectFields}
                            onSubmit={handleProjectAdd}
                            title={<PlusCircle size={14} />}
                        />
                    </div>
                    <div className="space-y-6">
                        {sortByDate(profile.projects)?.map((proj) => (
                            <div key={proj.id} className="group relative">
                                <div className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <EditProfileDialog
                                        fields={projectFields}
                                        initialData={proj}
                                        onSubmit={(formData) => handleProjectEdit(proj.id, formData)}
                                        title={<Edit2 size={14} />}
                                    />
                                    <CancelDialog experience={proj} onConfirm={() => handleProjectDelete(proj.id)} />
                                </div>
                                <div>
                                    <h3 className="font-medium">{proj.project_name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {formatStartDate(proj.start_date)} - {proj.is_current ? 'Present' : formatStartDate(proj.end_date)}
                                    </p>
                                    {proj.description && (
                                        <p className="mt-2 text-sm">{proj.description}</p>
                                    )}
                                    {proj.technologies_used && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {proj.technologies_used}
                                        </p>
                                    )}
                                    {proj.project_url && (
                                        <Link
                                            href={proj.project_url.startsWith('http') ? proj.project_url : `https://${proj.project_url}`}
                                            target="_blank"
                                            className="text-sm text-blue-500 hover:underline mt-1 block"
                                        >
                                            View Project
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Integrations */}
            <div className="mb-8">
                <h2 className="text-md font-semibold mb-4">Integrations</h2>
                <GitHubSection
                    githubUser={profile.user.github_user}
                    onLink={async (githubUser) => {
                        if (!githubUser) {
                            const response = await fetch('/api/user/github', {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${user.token}`,
                                },
                            });

                            if (response.ok) {
                                setProfile(prev => ({
                                    ...prev,
                                    user: { ...prev.user, github_user: null, github_access_token: null }
                                }));
                                toast({
                                    title: 'Success',
                                    description: 'GitHub account disconnected'
                                });
                            }
                        }
                    }}
                />
            </div>

        </div>
    );
}

const LoadingState = () => (
    <div className="container mx-auto py-10 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
        </div>
    </div>
);

const ErrorState = ({ message }) => (
    <div className="container mx-auto py-10 px-4 text-center">
        <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">Error loading profile</h2>
        <p className="mt-2 text-gray-600">{message}</p>
    </div>
);
