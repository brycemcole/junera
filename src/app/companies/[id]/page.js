import { getConnection } from "@/lib/db";
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
        <h1 className="text-2xl font-bold mb-2">{company.name}</h1>
        {company.location && <p className="text-md font-medium">{company.location}</p>}
        {company.website && <p>{company.website}</p>}
        <Accordion type="single" collapsible className="w-full" defaultValue="item-description">
            {[
                { key: "description", label: "Company Description", content: company.description },
                { key: "location", label: "Location", content: company.location },
                { key: "link", label: "Website", content: company.link },
                { key: "industry", label: "Industry", content: company.industry },
                { key: "founded_size_stock", label: "Founded, Size & Stock Symbol", content: (
                    <>
                        {company.founded && <p>Founded: {new Date(company.founded).toLocaleDateString()}</p>}
                        {company.size && <p>Size: {company.size}</p>}
                        {company.stock_symbol && <p>Stock Symbol: {company.stock_symbol}</p>}
                    </>
                )},
                { key: "company_issues", label: "Company Issues", content: company.company_issues },
                { key: "company_engineer_choice", label: "Engineer Choice", content: company.company_engineer_choice },
                { key: "company_sentiment", label: "Company Sentiment", content: company.company_sentiment },
                { key: "company_recent_news_sentiment", label: "Recent News Sentiment", content: company.company_recent_news_sentiment },
                { key: "company_stage", label: "Company Stage", content: company.company_stage },
                { key: "twitter_username", label: "Twitter Username", content: company.twitter_username },
                { key: "company_website", label: "Company Website", content: company.company_website },
            ].map(({ key, label, content }) => content && (
                <AccordionItem key={key} value={`item-${key}`}>
                    <AccordionTrigger className="text-md">{label}</AccordionTrigger>
                    <AccordionContent className="text-md font-medium">{content}</AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
        <h2 className="text-xl font-bold mt-8 mb-4">Job Postings</h2>
        <ul className="mb-8">
            {jobPostings.slice(0, MAX_POSTINGS).map(job => (
                <li key={job.id} className="mb-2">
                    <Link href={`/job-postings/${job.id}`}>
                    <p className="text-lime-500 hover:underline">{job.title}</p>
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
                className="text-lime-500 hover:underline"   
            >
                View All Job Postings
            </Link>
        )}
    </div>
);
}