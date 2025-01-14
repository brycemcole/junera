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
            type: 'text',
            name: 'username',
            label: 'Username',
            placeholder: 'Enter username',
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
            type: 'text',
            name: 'job_prefs_title',
            label: 'Desired Job Title'
        },
        {
            type: 'text',
            name: 'job_prefs_location',
            label: 'Preferred Location'
        },
        {
            type: 'text',
            name: 'job_prefs_industry',
            label: 'Preferred Industry'
        },
        {
            type: 'select',
            name: 'job_prefs_level',
            label: 'Experience Level',
            options: [
                { value: 'internship', label: 'Internships' },
                { value: 'entry', label: 'Entry Level' },
                { value: 'mid', label: 'Mid Level' },
                { value: 'senior', label: 'Senior Level' },
                { value: 'lead', label: 'Lead' },
                { value: 'manager', label: 'Manager' }
            ]
        },
        {
            type: 'number',
            name: 'job_prefs_salary',
            label: 'Expected Salary'
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
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                toast({ title: 'Error', description: 'Failed to update profile', type: 'error' });
                throw new Error('Failed to update profile');
            }

            // Refresh profile data
            const updatedProfile = await response.json();
            setProfile(prev => ({
                ...prev,
                user: { ...prev.user, ...formData }
            }));
            toast({ title: 'Success', description: 'Profile updated successfully', type: 'success' });

        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message);
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
        <div className="container mx-auto py-0 px-4 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Profile</h1>
                <EditProfileDialog
                    fields={profileFields}
                    initialData={profile?.user}
                    onSubmit={handleProfileUpdate}
                    title={<Edit2 size={14} />}
                    description="Update your profile information"
                />
            </div>

            {/* Personal Information */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p><strong>Name:</strong> {profile.user.full_name}</p>
                        <p><strong>Username:</strong> {profile.user.username}</p>
                        <p><strong>Email:</strong> {profile.user.email}</p>
                        <p><strong>Headline:</strong> {profile.user.headline}</p>
                        <p><strong>Phone:</strong> {profile.user.phone_number}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Work Experience</CardTitle>
                    <EditProfileDialog
                        fields={experienceFields}
                        onSubmit={handleExperienceAdd}
                        title={<PlusCircle size={14} />}
                        description="Add new work experience"
                    />
                </CardHeader>
                <CardContent>
                    {sortExperiences(profile.experience)?.map((exp, index) => (
                        <div key={exp.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''} relative group`}>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <EditProfileDialog
                                    fields={experienceFields}
                                    initialData={exp}
                                    onSubmit={(formData) => handleExperienceEdit(exp.id, formData)}
                                    title={<Edit2 size={14} />}
                                    description="Update work experience"
                                />
                                <CancelDialog experience={exp} onConfirm={() => handleExperienceDelete(exp.id)} />
                            </div>
                            <div className="flex flex-row items-center gap-4">
                                <ExperienceAvatar image={`https://logo.clearbit.com/${encodeURIComponent(exp.company_name.replace('.com', ''))}.com`} username={exp.company_name} />
                                <div className="flex flex-col">
                                    <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                    <h3 className="font-semibold">{exp.job_title}</h3>
                                    {exp.is_current ?
                                        (
                                            <>
                                                <p className="text-sm">
                                                    {formatStartDate(exp.start_date)},  Present
                                                </p>

                                            </>
                                        ) : (
                                            <p className="text-sm">
                                                {formatStartDate(exp.start_date)},  {calculateDuration(exp.start_date, exp.end_date)}
                                            </p>
                                        )}
                                    <p className="mt-2">{exp.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Education */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Education</CardTitle>
                    <EditProfileDialog
                        fields={educationFields}
                        onSubmit={handleEducationAdd}
                        title={<PlusCircle size={14} />}
                        description="Add new education"
                    />
                </CardHeader>
                <CardContent>
                    {sortEducation(profile.education)?.map((edu, index) => (
                        <div key={edu.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''} relative group`}>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <EditProfileDialog
                                    fields={educationFields}
                                    initialData={edu}
                                    onSubmit={(formData) => handleEducationEdit(edu.id, formData)}
                                    title={<Edit2 size={14} />}
                                    description="Update education information"
                                />
                                <CancelDialog experience={edu} onConfirm={() => handleEducationDelete(edu.id)} />
                            </div>
                            <h3 className="font-semibold">{edu.institution_name}</h3>
                            <p className="text-sm">{edu.degree} in {edu.field_of_study}</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(edu.start_date).toLocaleDateString()} - {edu.is_current ? 'Present' : new Date(edu.end_date).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Projects */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Projects</CardTitle>
                    <EditProfileDialog
                        fields={projectFields}
                        onSubmit={handleProjectAdd}
                        title={<PlusCircle size={14} />}
                        description="Add new project"
                    />
                </CardHeader>
                <CardContent>
                    {sortByDate(profile.projects)?.map((proj, index) => (
                        <div key={proj.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''} relative group`}>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <EditProfileDialog
                                    fields={projectFields}
                                    initialData={proj}
                                    onSubmit={(formData) => handleProjectEdit(proj.id, formData)}
                                    title={<Edit2 size={14} />}
                                    description="Update project information"
                                />
                                <CancelDialog experience={proj} onConfirm={() => handleProjectDelete(proj.id)} />
                            </div>
                            <h3 className="font-semibold">{proj.project_name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {formatStartDate(proj.start_date)} - {proj.is_current ? 'Present' : formatStartDate(proj.end_date)}
                            </p>
                            <p className="mt-2">{proj.description}</p>
                            {proj.technologies_used && (
                                <p className="mt-1 text-sm text-muted-foreground">Technologies: {proj.technologies_used}</p>
                            )}
                            {proj.project_url && (
                                <Link href={proj.project_url} target="_blank" className="text-sm text-blue-500 hover:underline mt-1 block">
                                    {proj.project_url}
                                </Link>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Certifications</CardTitle>
                    <EditProfileDialog
                        fields={certificationFields}
                        onSubmit={handleCertificationAdd}
                        title={<PlusCircle size={14} />}
                        description="Add new certification"
                    />
                </CardHeader>
                <CardContent>
                    {sortByDate(profile.certifications)?.map((cert, index) => (
                        <div key={cert.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''} relative group`}>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <EditProfileDialog
                                    fields={certificationFields}
                                    initialData={cert}
                                    onSubmit={(formData) => handleCertificationEdit(cert.id, formData)}
                                    title={<Edit2 size={14} />}
                                    description="Update certification information"
                                />
                                <CancelDialog experience={cert} onConfirm={() => handleCertificationDelete(cert.id)} />
                            </div>
                            <h3 className="font-semibold">{cert.certification_name}</h3>
                            <p className="text-sm">{cert.issuing_organization}</p>
                            <p className="text-sm text-muted-foreground">
                                Issued: {formatStartDate(cert.issue_date)}
                                {cert.expiration_date && ` · Expires: ${formatStartDate(cert.expiration_date)}`}
                            </p>
                            {cert.credential_url && (
                                <Link href={cert.credential_url} target="_blank" className="text-sm text-blue-500 hover:underline mt-1 block">
                                    View Credential
                                </Link>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Awards */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Awards</CardTitle>
                    <EditProfileDialog
                        fields={awardFields}
                        onSubmit={handleAwardAdd}
                        title={<PlusCircle size={14} />}
                        description="Add new award"
                    />
                </CardHeader>
                <CardContent>
                    {sortByDate(profile.awards)?.map((award, index) => (
                        <div key={award.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''} relative group`}>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <EditProfileDialog
                                    fields={awardFields}
                                    initialData={award}
                                    onSubmit={(formData) => handleAwardEdit(award.id, formData)}
                                    title={<Edit2 size={14} />}
                                    description="Update award information"
                                />
                                <CancelDialog experience={award} onConfirm={() => handleAwardDelete(award.id)} />
                            </div>
                            <h3 className="font-semibold">{award.award_name}</h3>
                            <p className="text-sm">{award.award_issuer}</p>
                            <p className="text-sm text-muted-foreground">
                                {formatStartDate(award.award_date)}
                            </p>
                            {award.award_description && (
                                <p className="mt-2">{award.award_description}</p>
                            )}
                            {award.award_url && (
                                <Link href={award.award_url} target="_blank" className="text-sm text-blue-500 hover:underline mt-1 block">
                                    View Award
                                </Link>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Job Preferences */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Job Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-muted-foreground">
                            <strong className="text-foreground">{profile.user.job_prefs_title || 'Any'}</strong> jobs {profile.user.job_prefs_relocatable || 'only'} in <strong className="text-foreground">{profile.user.job_prefs_location || 'Any location'}</strong> requiring <strong className="text-foreground">{profile.user.job_prefs_level || 'Any'}</strong> experience level.
                            making <strong className="text-foreground">{profile.user.job_prefs_salary || 'Any'}</strong> annually.
                        </p>
                    </div>
                </CardContent>
            </Card>
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
