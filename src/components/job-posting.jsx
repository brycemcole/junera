import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function JobCard({ job }) {
    const postedDateRelative = job.postedDate ? formatDistanceToNow(new Date(job.postedDate), { addSuffix: true, includeSeconds: true }) : "";

    return (
        <article itemScope itemType="https://schema.org/JobPosting">
            <Link href={`/job-postings/${job.id || job.jobId}`} key={job.id || job.jobId}>
                <div className="flex items-center gap-4 py-4 bg-background mb-2">
                    <Avatar>
                        <AvatarImage itemProp="image" src={job.logo || `https://logo.clearbit.com/${job.company?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} alt={`${job.company} logo`} />
                        <AvatarFallback>{job.company?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                            <CardDescription itemProp="name">{job.company}</CardDescription>
                        </div>
                        <CardTitle>
                            <span itemProp="title">{job.title}</span>
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            <span itemProp="jobLocation" itemScope itemType="https://schema.org/Place">
                                <span itemProp="address">{job.location}</span>
                            </span>
                            {job.experienceLevel ? (
                                <span itemProp="employmentType">{` • ${job.experienceLevel}`}</span>
                            ) : null}
                            {postedDateRelative ? (
                                <time itemProp="datePosted" dateTime={job.postedDate}>{` • ${postedDateRelative}`}</time>
                            ) : null}
                            {job.salary ? (
                                <div itemProp="baseSalary" itemScope itemType="https://schema.org/MonetaryAmount">
                                    <span itemProp="value">{` • ${job.salary}`}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}