"use client"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
  import { formatDistanceToNow } from "date-fns";
import { MapPin, Briefcase, Calendar, DollarSign } from "lucide-react";
import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function CollapsibleDemo({ title, jobPostings }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter();
return (
    <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full space-y-2"
    >
        <div className="flex items-center justify-between space-x-4 mt-4">
            <h4 className="text-sm font-semibold">
                {title}
            </h4>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                </Button>
            </CollapsibleTrigger>
        </div>
        <div
    className="rounded-md border px-4 py-3 font-mono flex flex-col gap-2 text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out"
    onClick={() => router.push(`/job-postings/${jobPostings[0]?.id}`)}
>
    <div className="flex items-center gap-4">
        {/* Company Logo */}
        {jobPostings[0]?.companyLogo && (
            <img
                src={jobPostings[0].companyLogo}
                alt={`${jobPostings[0].company} logo`}
                className="h-8 w-8 rounded-full"
            />
        )}
        {/* Company Name and Title */}
        <div className="flex flex-col">
            <span className="font-bold text-base">
                {jobPostings[0]?.title || "No job titles available"}
            </span>
            <span className="text-sm text-muted-foreground">
                {jobPostings[0]?.company || "No company name available"}
            </span>
        </div>
    </div>
    {/* Details Section */}
    <div className="flex flex-row flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-foreground" />
            <span>{jobPostings[0]?.salary || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-foreground" />
            <span>{jobPostings[0]?.location || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-foreground" />
            <span>{jobPostings[0]?.experienceLevel || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-foreground" />
            <span>
                {jobPostings[0]?.postedDate
                    ? `${formatDistanceToNow(new Date(jobPostings[0].postedDate), {
                          addSuffix: true,
                      })}`
                    : "N/A"}
            </span>
            </div>
    </div>
</div>
        <CollapsibleContent className="space-y-2">
            {jobPostings.slice(1).map((posting) => (
                <div key={posting.id} 
                    className="rounded-md border px-4 py-3 font-mono text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out" 
                    onClick={() => router.push(`/job-postings/${posting.id}`)}
                >
                    {/* Header Section */}
                    <div className="flex items-center gap-4 mb-3">
                        {posting.companyLogo && (
                            <Avatar  alt={posting.companyName} className="w-8 h-8 rounded-full">
                            <AvatarImage  src={posting.companyLogo}  />
                            <AvatarFallback>{posting.companyName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold text-base">{posting?.title || "No job titles available"}</span>
                            <span className="text-sm text-muted-foreground">{posting?.company || "No company name available"}</span>
                        </div>
                    </div>
                    {/* Details Section */}
                    <div className="flex flex-row flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-foreground" />
                            <span>{posting?.location || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-foreground" />
                            <span>{posting?.experienceLevel || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-foreground" />
                            <span>
    {posting?.postedDate 
        ? `${formatDistanceToNow(new Date(posting.postedDate), { addSuffix: true })}` 
        : "N/A"}
</span>

                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-foreground" />
                            <span>{posting?.salary || "N/A"}</span>
                        </div>
                    </div>
                </div>
            ))}
        </CollapsibleContent>
    </Collapsible>
)
}
