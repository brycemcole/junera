import { getConnection } from "@/lib/db";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import EnhanceJobPopover from "./enhance-popover";
import Link from "next/link";
import Button24 from "@/components/button24"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Flag, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "../../../components/job-posting";
import { CollapsibleDemo } from "./collapsible";

export function CompanyHoverCard({ companyName, companyLogo, companyDescription, companyId }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild className="p-0">
        <Button variant="link" className="p-0 text-lg font-semibold">
                                      <Avatar alt={companyName} className="w-8 h-8 rounded-full">
                            <AvatarImage src={companyLogo} />
                            <AvatarFallback>{companyName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>          
          {companyName}</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 mx-4">
        <Link href={`/companies/${companyId}`}>
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src={companyLogo || "https://via.placeholder.com/150"} />
            <AvatarFallback>{companyName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{companyName}</h4>
            <p className="text-sm">
              {companyDescription}
            </p>
          </div>
        </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}

export function ReportPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline"><Flag /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mx-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Report Job Posting</h4>
            <p className="text-sm text-muted-foreground">
              Report an issue with this job posting
            </p>
          </div>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="missingInformation"
                  name="issueType"
                  value="missingInformation"
                  className="h-4 w-4"
                />
                <label htmlFor="missingInformation" className="text-sm">
                  Missing Information
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="inactiveJob"
                  name="issueType"
                  value="inactiveJob"
                  className="h-4 w-4"
                />
                <label htmlFor="inactiveJob" className="text-sm">
                  Inactive Job Posting
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="incorrectDetails"
                  name="issueType"
                  value="incorrectDetails"
                  className="h-4 w-4"
                />
                <label htmlFor="incorrectDetails" className="text-sm">
                  Incorrect Job Details
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="other"
                  name="issueType"
                  value="other"
                  className="h-4 w-4"
                />
                <label htmlFor="other" className="text-sm">
                  Other
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="comments" className="text-sm font-medium">
                Additional Comments (optional)
              </label>
              <textarea
                id="comments"
                rows="3"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                placeholder="Provide more details here..."
              ></textarea>
            </div>
            <Button type="submit">Submit Report</Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

async function getJobPostingById(id) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("id", id)
    .query(`
      SELECT jobPostings.*, 
             companies.name AS companyName, 
             companies.description AS companyDescription, 
             companies.logo AS logo 
      FROM jobPostings 
      JOIN companies 
      ON jobPostings.company_id = companies.id 
      WHERE jobPostings.id = @id
    `);

  const jobPosting = result.recordset[0];

  if (jobPosting) {
    // Remove the LinkHash field if it exists
    delete jobPosting.LinkHash;
  }

  return jobPosting;
}



async function getRelatedJobPostings(jobPosting) {
  const pool = await getConnection();

  // Fetch similar job postings based on location, title, and experience level
  const similarPostings = await pool.request()
    .input('id', jobPosting.id)
    .input('location', jobPosting.location)
    .input('title', jobPosting.title)
    .query(`
      SELECT TOP 10 jobPostings.*, 
             companies.name AS company, 
             companies.description AS companyDescription, 
             companies.logo AS companyLogo
      FROM jobPostings
      JOIN companies ON jobPostings.company_id = companies.id
      WHERE jobPostings.id != @id
        AND FREETEXT(jobPostings.title, @title)
    `);

  // Fetch job postings from the same company
  const sameCompanyPostings = await pool.request()
    .input('companyId', jobPosting.company_id)
    .input('id', jobPosting.id)
    .query(`
      SELECT TOP 10 jobPostings.*, 
             companies.name AS company, 
             companies.description AS companyDescription, 
             companies.logo AS companyLogo
      FROM jobPostings
      JOIN companies ON jobPostings.company_id = companies.id
      WHERE jobPostings.company_id = @companyId
        AND jobPostings.id != @id
    `);

  return {
    similarPostings: similarPostings.recordset,
    sameCompanyPostings: sameCompanyPostings.recordset
  };
}

export default async function JobPostingPage({ params }) {
  const { id } = await params;
  const jobPosting = await getJobPostingById(id);

  if (!jobPosting) {
    return <div>Job posting not found.</div>;
  }
  

  const relatedPostings = await getRelatedJobPostings(jobPosting);

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/companies/${jobPosting.company_id}`}>{jobPosting.companyName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{jobPosting.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CompanyHoverCard 
        className="text-lg font-semibold"
        companyName={jobPosting.companyName} 
        companyLogo={jobPosting.companyLogo} 
        companyDescription={jobPosting.companyDescription}
        companyId={jobPosting.company_id}
      />
      <h1 className="text-2xl font-bold mb-2">{jobPosting.title}</h1>
      <p className="text-md">{jobPosting.salary_range_str} | {jobPosting.location} | {new Date(jobPosting.postedDate).toLocaleDateString()} | {jobPosting.experienceLevel}</p>
      <p>{jobPosting.salary ? `${jobPosting.salary}` : ""}</p>
      <div className="flex flex-wrap gap-4 mt-4 mb-8">
        <Link href={`${jobPosting.link}`}>
          <Button className="bg-lime-500 text-white hover:bg-green-800 dark:bg-lime-600">Apply</Button>
        </Link>
        <ReportPopover />
        <EnhanceJobPopover jobPosting={jobPosting} />
        <Button24 />
      </div>
      <div className="flex flex-col space-y-2 mb-4">
  <Link href={`/job-postings?explevel=${encodeURIComponent(jobPosting.experienceLevel)}`}>
    <p className="text-lime-500 underline">See more {jobPosting.experienceLevel} jobs</p>
  </Link>
  <Link href={`/job-postings?location=${encodeURIComponent(jobPosting.location.trim())}`}>
    <p className="text-lime-500 underline">See jobs in {jobPosting.location.trim()}</p>
  </Link>
  <Link href={`/job-postings?title=${encodeURIComponent(jobPosting.title.trim())}`}>
    <p className="text-lime-500 underline">See more '{jobPosting.title.trim()}' jobs</p>
  </Link>
</div>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-description">
        {[
          { key: 'companyDescription', label: 'Company Description' },
          { key: 'description', label: 'Job Description' },
          { key: 'responsibilities', label: 'Responsibilities' },
          { key: 'requirements', label: 'Requirements' },
          { key: 'Benefits', label: 'Benefits' },
          { key: 'MinimumQualifications', label: 'Minimum Requirements' },
          { key: 'relocation', label: 'Relocation Assistance' },
          { key: 'EqualOpportunityEmployerInfo', label: 'Equal Opportunity Employer Info' },
          { key: 'IsRemote', label: 'Remote Work Availability' },
          { key: 'H1BVisaSponsorship', label: 'H1B Visa Sponsorship' },
          { key: 'HoursPerWeek', label: 'Hours Per Week' },
          { key: 'Schedule', label: 'Schedule' },
          { key: 'NiceToHave', label: 'Nice to Have' }
        ].map(({ key, label }) => (
          typeof jobPosting[key] === 'string' && jobPosting[key].length > 4 && (
            <AccordionItem className="text-md" key={key} value={`item-${key}`}>
              <AccordionTrigger className="text-md">{label}</AccordionTrigger>
              <AccordionContent>{jobPosting[key]}</AccordionContent>
            </AccordionItem>
          )
        ))}
      </Accordion>

      <CollapsibleDemo 
        title="Similar Job Postings" 
        jobPostings={relatedPostings.similarPostings} 
      />

      <CollapsibleDemo
        title={`More Jobs at ${jobPosting.companyName}`}
        jobPostings={relatedPostings.sameCompanyPostings}
      />
    </div>
  );
}