'use client';

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"

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
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="flex flex-col items-center md:flex-col md:items-start gap-2">
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
                                        <div className="flex flex-row justify-between">
                                        <h3 className="font-semibold text-lg">{job.title}</h3>
                                        {isOwnProfile && (
<Sheet>
  <SheetTrigger>Edit</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit Work Experience</SheetTitle>
      <SheetDescription>
        Make changes to your work experience at {job.companyName}.
        </SheetDescription>

      <div className="grid gap-4 py-4">

      <div className="grid grid-cols-4 items-center gap-4">

        <Label>
            Job Title
        </Label>
        <Input type="text" className="col-span-3" placeholder="Job Title" value={job.title} />
        <Label>
            Company Name
        </Label>
        <Input type="text" className="col-span-3" placeholder="Company Name" value={job.companyName} />
        <Label>
            Start Date
        </Label>
        <Input type="date" className="col-span-3" value={new Date(job.startDate).toISOString().split('T')[0]} />
        <Label>
            Current Job
        </Label>
        <Input type="checkbox" className="col-span-3 h-4 w-4 ml-auto bg-accent" checked={job.isCurrent} />
        <Label>
            End Date
        </Label>
        <Input type="date" className="col-span-3" value={new Date(job.endDate).toISOString().split('T')[0]} />
        <Label>
            Description
        </Label>
        <Textarea type="text" className="col-span-4" placeholder="Description"  value={job.description} rows="8" />

</div>
</div>
    </SheetHeader>
    <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
  </SheetContent>
</Sheet>
                                        )}
</div>
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
                                        <div className="flex flex-row justify-between">
                                        <h3 className="font-semibold text-lg">{edu.institutionName}</h3>
                                        {isOwnProfile && (
<Sheet>
  <SheetTrigger>Edit</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit Education Details</SheetTitle>
      <SheetDescription>
        Make changes to your education details at {edu.institutionName}.
        </SheetDescription>
        <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
        <Label>
            Institution Name
        </Label>
        <Input type="text" className="col-span-3" placeholder="Institution Name" value={edu.institutionName} />
        <Label>
            Degree
        </Label>
        <Input type="text" className="col-span-3" placeholder="Degree" value={edu.degree} />
        <Label>
            Field of Study
        </Label>
        <Input type="text" className="col-span-3" placeholder="Field of Study" value={edu.fieldOfStudy} />
        <Label>
            Start Date
        </Label>
        <Input type="date" className="col-span-3" value={new Date(edu.startDate).toISOString().split('T')[0]} />
        <Label>
            End Date
        </Label>
        <Input type="date" className="col-span-3" value={new Date(edu.endDate).toISOString().split('T')[0]} />
        <Label>
            Description
        </Label>
        <Input type="text" className="col-span-4" placeholder="Description" value={edu.description} />
</div>
</div>
    </SheetHeader>
    <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
  </SheetContent>
</Sheet>
                                        )}  
</div>
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