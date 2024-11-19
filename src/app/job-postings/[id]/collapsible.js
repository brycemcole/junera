"use client"

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
        <div className="rounded-md border px-4 py-3 font-mono flex flex-col text-sm space-x-2" onClick={() => router.push(`/job-postings/${jobPostings[0]?.id}`)}>
        <div className="flex flex-row gap-4">
            {jobPostings[0]?.companyLogo && (
                <img src={jobPostings[0].companyLogo} alt={`${jobPostings[0].company} logo`} className="h-6 w-6 rounded-full" />
            )}
            {jobPostings[0]?.company}</div>
            {jobPostings[0]?.title || "No job titles available"}
        </div>
        <CollapsibleContent className="space-y-2">
            {jobPostings.slice(1).map((posting) => (
                <div key={posting.id} className="rounded-md border px-4 py-3 font-mono text-sm pointer-cursor hover:bg-accent" onClick={() => router.push(`/job-postings/${posting.id}`)}>
                    <div className="flex flex-row gap-4">
                        {posting.companyLogo && (
                            <img src={posting.companyLogo} alt={`${posting.company} logo`} className="h-6 w-6 rounded-full" />
                        )}
                        {posting.company}
                    </div>
                    {posting.title || "No job titles available"}
                </div>
            ))}
        </CollapsibleContent>
    </Collapsible>
)
}
