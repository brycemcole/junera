'use client';

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserRoundPen } from "lucide-react";

export default function ProfilePage({ params }) {
  const { user } = useAuth();
  const { username } = params;
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showMore, setShowMore] = React.useState(false);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        // First fetch basic profile data
        const response = await fetch(`/api/user/${username}`);
        const data = await response.json();
        
        // If this is the user's own profile, fetch additional data
        if (user?.username === username) {
          const detailResponse = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          const detailData = await detailResponse.json();
          setProfile({
            ...data,
            education: detailData.education || [],
            experience: detailData.experience || []
          });
        } else {
          setProfile({
            ...data,
            education: [],
            experience: []
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>User not found</div>;
  }

  const isOwnProfile = user?.username === username;

return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-4xl">
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/p">Profiles</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/p/${username}`}>{username}</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col items-center md:flex-row md:items-center gap-4 mb-8">
                <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.firstname?.[0]}{profile.lastname?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{profile.firstname} {profile.lastname}</h1>
                        <p className="text-muted-foreground">{profile.desired_job_title}</p>
                    </div>
                    {isOwnProfile && (
                        <Button
                            variant="ghost"
                            onClick={() => window.location.href = `/p/${username}/edit`}
                        >
                            <UserRoundPen strokeWidth={1.5} className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            {(profile.professionalSummary || profile.bio) && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <p
                                className={`whitespace-pre-wrap overflow-hidden transition-all duration-300 ${
                                    showMore ? 'line-clamp-none' : 'line-clamp-2'
                                }`}
                            >
                                {profile.professionalSummary || profile.bio}
                            </p>
                            <Button
                                variant="link"
                                className="mt-2 p-0"
                                onClick={() => setShowMore((prev) => !prev)}
                            >
                                {showMore ? 'Show Less' : 'Show More'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {profile.experience.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {profile.experience.map((job) => (
                                    <div key={job.id} className="border-b last:border-0 pb-4">
                                        <h3 className="font-semibold text-lg">{job.title}</h3>
                                        <p className="text-muted-foreground font-medium">{job.companyName}</p>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {new Date(job.startDate).toLocaleDateString()} - 
                                            {job.isCurrent ? ' Present' : ` ${new Date(job.endDate).toLocaleDateString()}`}
                                        </p>
                                        {job.description && (
                                            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {profile.education.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Education</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {profile.education.map((edu) => (
                                    <div key={edu.id} className="border-b last:border-0 pb-4">
                                        <h3 className="font-semibold text-lg">{edu.institutionName}</h3>
                                        <p className="text-muted-foreground">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {new Date(edu.startDate).toLocaleDateString()} - 
                                            {edu.isCurrent ? ' Present' : ` ${new Date(edu.endDate).toLocaleDateString()}`}
                                        </p>
                                        {edu.description && (
                                            <p className="text-muted-foreground whitespace-pre-wrap">{edu.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
);
}