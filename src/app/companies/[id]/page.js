import { getConnection } from "@/lib/db";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"
import { Factory, MapPin, Pin, Rocket, Twitter, X } from "lucide-react";
  
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
        return <div>Company not found.</div>;
    }

return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/job-postings">Jobs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{company.name}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl flex flex-row gap-2 font-bold mb-2">
            <Avatar alt={company.name} className="w-8 h-8 rounded-full">
                <AvatarFallback>{company.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {company.name}</h1>
        <div className="space-y-2 mb-2">
        {company?.location && <>
        <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin size={16} />
        <p className="text-sm text-muted-foreground font-medium">{company.location}</p>
        </div>
        </>}
        {company?.industry && 
        <>
        <div className="flex items-center gap-2 text-muted-foreground">
        <Factory size={16} />
        <p className="text-sm text-muted-foreground font-medium">{company.industry}</p>
        </div>
        </>}

        {company?.twitter_username  &&
        <>
        <div className="flex items-center gap-2 text-muted-foreground">
            <Twitter size={16} /> 
            <p className="text-sm text-muted-foreground font-medium">{company.twitter_username}</p>
</div>
        </>

        }
              {company?.company_stage  &&
        <>
        <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket size={16} /> 
            <p className="text-sm text-muted-foreground font-medium">{company.company_stage}</p>
</div>
        </>

        }

        
        </div>

        {company?.description && <p className="text-md font-medium leading-loose">{company.description}</p>}
        <div className="mb-1 flex space-x-5 text-[13px] font-medium text-muted-foreground">
                        {company.founded && <><p>Founded: {new Date(company.founded).toLocaleDateString()}</p></>}
                        {company.size && <p>Size: {company.size} employees</p>}
                        {company.stock_symbol && <p>Stock Symbol: {company.stock_symbol}</p>}
                        </div>
        {company?.website && <p>{company.website}</p>}


        <h2 className="text-xl font-bold mt-8 mb-4">Job Postings</h2>
        <ul className="mb-8">
            {jobPostings.slice(0, MAX_POSTINGS).map(job => (
                <li key={job.id} className="mb-2">
                    <Link href={`/job-postings/${job.id}`}>
                    <p className="text-green-600 hover:underline">{job.title}</p>
                    <p>
  {job.location && <span>{job.location}</span>}
  {job.location && job.experienceLevel && <span> | </span>}
  {job.experienceLevel && <span>{job.experienceLevel}</span>}
  {(job.location || job.experienceLevel) && job.postedDate && <span> | </span>}
  {job.postedDate && <span>{new Date(job.postedDate).toLocaleDateString()}</span>}
  {(job.location || job.experienceLevel || job.postedDate) && job.salary !== undefined && job.salary !== null && <span> | </span>}
  {job.salary !== undefined && job.salary !== null && <span>{job.salary > 0 ? `$${job.salary}` : "N/A"}</span>}
</p>
                    </Link>
                </li>
            ))}
        </ul>
        {jobPostings.length > MAX_POSTINGS && (
            <Link 
                href={`/job-postings?company=${id}`}
                className="text-green-600 hover:underline"   
            >
                View All Job Postings
            </Link>
        )}
    </div>
);
}