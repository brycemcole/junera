'use client';

import { memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Bell, Share2, MapPin, Users, Github } from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import SuggestedUsers from '@/components/SuggestedUsers';
import { EmptyState } from '@/components/empty-state';

const ProfileContent = memo(({ profile, onFollow, isFollowing, user, currentUsername }) => {
    const { toast } = useToast();

    if (!profile) return null;

    return (
        <>
            <section className="mb-4">
                <h1 className="text-xl font-[family-name:var(--font-geist-sans)] font-medium mb-1">
                    {profile.user.full_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {profile.user.username}
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
                            {profile.user.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <MapPin className="h-4 w-4" />
                                    {profile.user.location}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {user && user.username !== currentUsername && (
                    <div className="flex flex-wrap flex-col gap-2 mb-6">
                        <div className="flex gap-3">
                            <Button
                                className={cn(
                                    "gap-2 w-full md:w-48 max-w-64",
                                    isFollowing
                                        ? "bg-green-500/10 text-green-600 border border-green-600/20 hover:bg-green-500/20 hover:text-green-500"
                                        : "bg-blue-500/10 text-blue-600 border border-blue-600/20 hover:bg-blue-500/20 hover:text-blue-500"
                                )}
                                onClick={onFollow}
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
                            <Button
                                variant="outline"
                                className="ml-auto"
                                size="icon"
                                onClick={() => {
                                    const url = window.location.href;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `${profile.user.full_name}'s Profile`,
                                            url: url
                                        });
                                    } else {
                                        navigator.clipboard.writeText(url);
                                        toast({
                                            title: "Link copied",
                                            description: "Profile link copied to clipboard",
                                        });
                                    }
                                }}
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Experience */}
            <div className="mb-8">
                <h2 className="text-md font-semibold mb-4">Experience</h2>
                {profile.experience.length > 0 ? (
                    <div className="space-y-6">
                        {profile.experience?.map((exp) => (
                            <div key={exp.id} className="flex gap-4">
                                <Avatar className="rounded-lg">
                                    <AvatarImage
                                        src={`https://logo.clearbit.com/${encodeURIComponent(exp.company_name.replace('.com', ''))}.com`}
                                        alt={exp.company_name}
                                    />
                                    <AvatarFallback>{exp.company_name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">{exp.job_title}</h3>
                                    <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {exp.is_current
                                            ? `${format(new Date(exp.start_date), 'MMMM yyyy')} - Present`
                                            : `${format(new Date(exp.start_date), 'MMMM yyyy')} - ${format(new Date(exp.end_date), 'MMMM yyyy')}`
                                        }
                                    </p>
                                    {exp.description && (
                                        <p className="mt-2 text-sm">{exp.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState type="experience" />
                )}
            </div>

            {/* Education */}
            <div className="mb-8">
                <h2 className="text-md font-semibold mb-4">Education</h2>
                {profile.education.length > 0 ? (
                    <div className="space-y-6">
                        {profile.education?.map((edu) => (
                            <div key={edu.id}>
                                <h3 className="font-medium">{edu.institution_name}</h3>
                                <p className="text-sm">{edu.degree} in {edu.field_of_study}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(edu.start_date), 'MMMM yyyy')} - {edu.is_current ? 'Present' : format(new Date(edu.end_date), 'MMMM yyyy')}
                                </p>
                                {edu.description && (
                                    <p className="mt-2 text-sm">{edu.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState type="education" />
                )}
            </div>

            {/* Certifications */}
            {profile.certifications?.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-md font-semibold mb-4">Certifications</h2>
                    <div className="space-y-6">
                        {profile.certifications.map((cert) => (
                            <div key={cert.id}>
                                <h3 className="font-medium">{cert.certification_name}</h3>
                                <p className="text-sm">{cert.issuing_organization}</p>
                                <p className="text-sm text-muted-foreground">
                                    Issued: {format(new Date(cert.issue_date), 'MMMM yyyy')}
                                    {cert.expiration_date && ` · Expires: ${format(new Date(cert.expiration_date), 'MMMM yyyy')}`}
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
                    </div>
                </div>
            )}

            {/* GitHub Integration */}
            {profile.user.github_user && (
                <div className="mb-8">
                    <h2 className="text-md font-semibold mb-4">Connected Accounts</h2>
                    <div className="flex items-center gap-2">
                        <Github size={20} />
                        <span>
                            GitHub: <Link href={`https://github.com/${profile.user.github_user}`} target="_blank" className="text-blue-500 hover:underline">{profile.user.github_user}</Link>
                        </span>
                    </div>
                </div>
            )}

            {/* Show empty state if profile has no content */}
            {!profile.experience?.length &&
                !profile.education?.length &&
                !profile.certifications?.length && (
                    <EmptyState type="profile" />
                )}

            {/* Suggested Users */}
            <div className="mt-12 mb-8">
                <h2 className="text-md font-semibold mb-4">Suggested Profiles</h2>
                <SuggestedUsers currentUsername={currentUsername} />
            </div>
        </>
    );
});

ProfileContent.displayName = 'ProfileContent';
export default ProfileContent;
