import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function JobCard({ job }) {
    return (
        <div className="border rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center">
                {job.logo && (
                    <Image src={job.logo} alt={`${job.company} logo`} className="w-12 h-12 mr-4" />
                )}
                <div>
                    <h2 className="text-xl font-semibold">
                        <Link href={`/job-postings/${job.id}`}>{job.title}</Link>
                    </h2>
                    <p className="text-muted-foreground">{job.company}</p>
                </div>
            </div>
            <div className="mt-2">
                <p>Location: {job.location}</p>
                <p>Experience Level: {job.experienceLevel}</p>
                <p>Salary: {job.salary}</p>
                <p>Posted Date: {new Date(job.postedDate).toLocaleDateString()}</p>
            </div>
        </div>
    );
}
