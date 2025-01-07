'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Add this import
import { useToast } from "@/hooks/use-toast"; // Add this import
import { Input } from "@/components/ui/input"; // Add this import
import { cn } from "@/lib/utils"; // Add this import
import { CircleAlert, LoaderIcon, MapPin, Building2, Bell, Share2, Star } from 'lucide-react';
import Link from 'next/link';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover" // Add this import
import { Label } from "@/components/ui/label"; // Add this import

export default function PublicProfilePage({ params }) {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast(); // Add this
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const username = await params.username;
                
                // If viewing own profile, redirect to /profile
                if (user?.username === username) {
                    router.push('/profile');
                    return;
                }

                const response = await fetch(`/api/users/${username}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const data = await response.json();
                setProfile(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [params.username, user, router]);

    // Add follow status check
    useEffect(() => {
        async function checkFollowStatus() {
            if (!user || user.username === params.username) return;

            try {
                const response = await fetch(`/api/users/${params.username}/follow`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsFollowing(data.isFollowing);
                }
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        }

        checkFollowStatus();
    }, [user, params.username]);

    const handleFollow = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please log in to follow users",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(`/api/users/${params.username}/follow`, {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
                toast({
                    title: isFollowing ? "Unfollowed" : "Following",
                    description: `You are ${isFollowing ? 'no longer following' : 'now following'} ${profile.user.full_name}`,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update follow status",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10 px-4 text-center">
                <LoaderIcon className="mx-auto h-8 w-8 animate-spin" />
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-10 px-4 text-center">
                <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-xl font-semibold">Profile not found</h2>
                <p className="mt-2 text-muted-foreground">The requested profile could not be found.</p>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            {/* Basic Info Card */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={profile.user.avatar} />
                                <AvatarFallback>{profile.user.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold mb-1">{profile.user.full_name}</h1>
                                <p className="text-muted-foreground">{profile.user.headline}</p>
                                {profile.user.job_prefs_location && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{profile.user.job_prefs_location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {user && user.username !== params.username && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "gap-2",
                                        isFollowing && "bg-primary/10 text-primary"
                                    )}
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? (
                                        <>
                                            <Star className="h-4 w-4" />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="h-4 w-4" />
                                            Follow
                                        </>
                                    )}
                                </Button>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="space-y-4">
                                            <h4 className="font-medium leading-none">Share Profile</h4>
                                            <div className="space-y-2">
                                                <Label htmlFor="profile-url">Profile URL</Label>
                                                <div className="flex space-x-2">
                                                    <Input
                                                        id="profile-url"
                                                        defaultValue={window.location.href}
                                                        readOnly
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(window.location.href);
                                                            setCopied(true);
                                                            setTimeout(() => setCopied(false), 2000);
                                                        }}
                                                    >
                                                        {copied ? "Copied!" : "Copy"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Experience Section */}
            {profile.experience?.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile.experience.map((exp, index) => (
                            <div key={exp.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={`https://logo.clearbit.com/${exp.company_name.toLowerCase()}.com`} />
                                        <AvatarFallback>{exp.company_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{exp.job_title}</h3>
                                        <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(exp.start_date).toLocaleDateString()} - {' '}
                                            {exp.is_current ? 'Present' : new Date(exp.end_date).toLocaleDateString()}
                                        </p>
                                        {exp.location && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                <MapPin className="inline h-4 w-4 mr-1" />
                                                {exp.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {exp.description && (
                                    <p className="mt-2 text-sm">{exp.description}</p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Education Section */}
            {profile.education?.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Education</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile.education.map((edu, index) => (
                            <div key={edu.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                                <h3 className="font-semibold">{edu.institution_name}</h3>
                                <p className="text-sm">{edu.degree} in {edu.field_of_study}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(edu.start_date).toLocaleDateString()} - {' '}
                                    {edu.is_current ? 'Present' : new Date(edu.end_date).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Certifications Section */}
            {profile.certifications?.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile.certifications.map((cert, index) => (
                            <div key={cert.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                                <h3 className="font-semibold">{cert.certification_name}</h3>
                                <p className="text-sm">{cert.issuing_organization}</p>
                                <p className="text-sm text-muted-foreground">
                                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                    {cert.expiration_date && ` · Expires: ${new Date(cert.expiration_date).toLocaleDateString()}`}
                                </p>
                                {cert.credential_url && (
                                    <Link 
                                        href={cert.credential_url}
                                        target="_blank"
                                        className="text-sm text-blue-500 hover:underline mt-1 block"
                                    >
                                        View Credential
                                    </Link>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
