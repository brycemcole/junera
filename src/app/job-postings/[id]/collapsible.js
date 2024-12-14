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

export function CollapsibleJobs({ title, jobPostings, open = false }) {
    const [isOpen, setIsOpen] = React.useState(open)
    const router = useRouter();

    if (!jobPostings || jobPostings.length === 0) {
        return null
    }
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
                    <Button variant="ghost" size="sm" className="">
                        {isOpen ? (
                            <>
                            View Less
                            </>
                        ) : (
                            <>
                            View More
                            </>
                        )}
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <div
                className="rounded-md border px-4 py-3 flex flex-col gap-2 text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out"
                onClick={() => router.push(`/job-postings/${jobPostings[0]?.id}`)}
            >
                <div className="flex items-center gap-4">
                    {/* Company Logo */}
                    {jobPostings[0]?.companyLogo ? (
                        <Avatar alt={jobPostings[0].company} className="w-8 h-8 rounded-full">
                            <AvatarImage src={jobPostings[0].companyLogo} onError={(e) => e.target.remove()} />
                            <AvatarFallback>{jobPostings[0].company?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    ) : (
                        (
                            <Avatar alt={jobPostings[0]?.company} className="w-8 h-8 rounded-full">
                                <AvatarFallback>{jobPostings[0]?.company?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )
                    )}
                    {/* Company Name and Title */}
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                            {jobPostings[0]?.company || "No company name available"}
                        </span>
                        <span className="font-semibold text-base">
                            {jobPostings[0]?.title || "No job titles available"}
                        </span>
                    </div>
                </div>
                {/* Details Section */}
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-foreground" />
                        <span>{jobPostings[0]?.salary?.toLocaleString() || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-foreground" />
                        <span>{jobPostings[0]?.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-foreground" />
                        <span>{jobPostings[0]?.experienceLevel || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-foreground" />
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
                        className="rounded-md border px-4 py-3 text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out"
                        onClick={() => router.push(`/job-postings/${posting.id}`)}
                    >
                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-3">
                            {posting.companyLogo ? (
                                <Avatar alt={posting.company} className="w-8 h-8 rounded-full">
                                    <AvatarImage src={posting.companyLogo} onError={(e) => e.target.remove()} />
                                    <AvatarFallback>{posting.company?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <Avatar alt={posting.company} className="w-8 h-8 rounded-full">
                                    <AvatarFallback>{posting.company?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">{posting?.company || "No company name available"}</span>
                                <span className="font-semibold text-base">{posting?.title || "No job titles available"}</span>
                            </div>
                        </div>
                        {/* Details Section */}
                        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-foreground" />
                                <span>{posting?.salary?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-foreground" />
                                <span>{posting?.location || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-3 w-3 text-foreground" />
                                <span>{posting?.experienceLevel || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-foreground" />
                                <span>
                                    {posting?.postedDate
                                        ? `${formatDistanceToNow(new Date(posting.postedDate), { addSuffix: true })}`
                                        : "N/A"}
                                </span>

                            </div>
                        </div>
                    </div>
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
}
