import { getConnection } from "@/lib/db";
import { ChevronRight, Globe, MapPin, Building } from "lucide-react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";

async function getCompanyById(id) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("id", id)
    .query("SELECT * FROM companies WHERE id = @id");

  return result.recordset[0]; // Return the first (and only) result
}

async function getJobPostingsByCompanyId(companyId) {
    const pool = await getConnection();
    const result = await pool
        .request()
        .input("companyId", companyId)
        .query("SELECT TOP 25 id, title, company_id, salary, postedDate, experienceLevel, location FROM jobPostings WHERE company_id = @companyId ORDER BY postedDate DESC");
    return result.recordset;
}


export default async function CompanyPage({ params }) {
    const { id } = await params; // Extract id from the URL
    const company = await getCompanyById(id);
    const jobPostings = await getJobPostingsByCompanyId(id);
    const MAX_POSTINGS = 20; // Maximum number of job postings to display

    if (!company) {
        return (
            <div className="container mx-auto py-10 px-4 max-w-4xl">
                <Alert variant="destructive">
                    <AlertTitle>Company not found</AlertTitle>
                    <AlertDescription>
                        The company you're looking for does not exist. Please check the URL or go back to the job postings page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center text-sm text-muted-foreground mb-6">
                <a href="/job-postings" className="text-lime-500 hover:underline flex items-center gap-1">
                    <Building size={16} /> Jobs
                </a>
                <ChevronRight className="mx-2" size={16} />
                <span>{company.name}</span>
            </div>

            {/* Company Header */}
            <h1 className="text-3xl font-bold mb-4">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {company.location && (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin size={14} /> {company.location}
                    </Badge>
                )}
                {company.industry && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        {company.industry}
                    </Badge>
                )}
                {company.size && (
                    <Badge variant="outline" className="flex items-center gap-1">
                        Size: {company.size}
                    </Badge>
                )}
                {company.stock_symbol && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        Stock: {company.stock_symbol}
                    </Badge>
                )}
            </div>
            {company.website && (
                <p className="mb-4">
                    <a
                        href={company.website}
                        className="text-lime-500 hover:underline flex items-center gap-1"
                    >
                        <Globe size={14} /> Visit Website
                    </a>
                </p>
            )}
            {company.description && <p className="text-muted-foreground mb-6">{company.description}</p>}

            <Separator className="my-6" />

            {/* Additional Company Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {company.founded && (
                    <div>
                        <h3 className="text-md font-semibold">Founded</h3>
                        <p>{new Date(company.founded).toLocaleDateString()}</p>
                    </div>
                )}
                {company.company_stage && (
                    <div>
                        <h3 className="text-md font-semibold">Stage</h3>
                        <p>{company.company_stage}</p>
                    </div>
                )}
                {company.company_sentiment && (
                    <div>
                        <h3 className="text-md font-semibold">Sentiment</h3>
                        <p>{company.company_sentiment}</p>
                    </div>
                )}
                {company.twitter_username && (
                    <div>
                        <h3 className="text-md font-semibold">Twitter</h3>
                        <p>
                            <a
                                href={`https://twitter.com/${company.twitter_username}`}
                                className="text-lime-500 hover:underline"
                            >
                                @{company.twitter_username}
                            </a>
                        </p>
                    </div>
                )}
            </div>

            <Separator className="my-6" />

            {/* Job Postings Section */}
            <h2 className="text-xl font-bold mb-4">Job Postings</h2>
            {jobPostings.length === 0 ? (
                <Alert variant="warning">
                    <AlertTitle>No Job Postings Available</AlertTitle>
                    <AlertDescription>
                        This company does not have any active job postings at the moment.
                    </AlertDescription>
                </Alert>
            ) : (
                <ul className="space-y-4">
                    {jobPostings.slice(0, MAX_POSTINGS).map(job => (
                        <li key={job.id} className="p-4 border rounded-lg hover:shadow-md transition">
                            <a href={`/job-postings/${job.id}`} className="text-lime-500 hover:underline">
                                <h3 className="font-bold">{job.title}</h3>
                            </a>
                            <p className="text-sm text-muted-foreground">
                                {job.location && <Badge className="mr-2">{job.location}</Badge>}
                                {job.experienceLevel && <Badge className="mr-2">Level: {job.experienceLevel}</Badge>}
                                {job.salary && (
                                    <Badge variant="outline">{job.salary > 0 ? `$${job.salary}` : "N/A"}</Badge>
                                )}
                                {job.postedDate && (
                                    <span className="ml-2">
                                        Posted on: {new Date(job.postedDate).toLocaleDateString()}
                                    </span>
                                )}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            {jobPostings.length > MAX_POSTINGS && (
                <div className="mt-6">
                    <a
                        href={`/job-postings?company=${id}`}
                        className="text-lime-500 hover:underline font-medium"
                    >
                        View All Job Postings
                    </a>
                </div>
            )}
        </div>
    );
}