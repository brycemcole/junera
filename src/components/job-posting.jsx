import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function JobCard({ job }) {
    const postedDateRelative = job.postedDate ? formatDistanceToNow(new Date(job.postedDate), { addSuffix: true, includeSeconds: true }) : "";

    return (
        <Link href={`/job-postings/${job.id || job.jobId}`} key={job.id || job.jobId}>
            <div className="flex items-center gap-4 py-4 bg-background mb-2">
                <Avatar>
                    <AvatarImage src={job.logo || "https://via.placeholder.com/150"} />
                    <AvatarFallback>{job.company?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardDescription>{job.company}</CardDescription>
                    <CardTitle>{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {job.location}
                        {job.experienceLevel ? ` • ${job.experienceLevel}` : ""}
                        {postedDateRelative ? ` • ${postedDateRelative}` : ""}
                        {job.salary ? ` • ${job.salary}` : ""}
                    </p>
                </div>
            </div>
        </Link>
    );
}