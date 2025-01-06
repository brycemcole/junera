"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ChevronLeft, ChevronRight, Factory, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobList } from "@/components/JobPostings";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CompanyView({ companyName, page }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [company, setCompany] = useState(null);
    const [jobPostings, setJobPostings] = useState([]);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        async function fetchCompanyData() {
            try {
                setLoading(true);
                // Decode the company name from the URL and re-encode it properly
                const decodedName = decodeURIComponent(companyName);
                const response = await fetch(`/api/companies/${encodeURIComponent(decodedName)}?page=${page}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    throw new Error(errorData.error || 'Failed to fetch company data');
                }

                const data = await response.json();
                console.log('Company Data:', data); // Debug log

                if (!data.company) {
                    throw new Error('No company data received');
                }

                setCompany(data.company);
                setJobPostings(data.jobPostings || []);
                setPagination(data.pagination);
                setError(null);
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (companyName) {
            fetchCompanyData();
        }
    }, [companyName, page]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages && newPage !== page) {
            //Scroll to the top of the page when a new page is presented
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            router.push(`/companies/${companyName}?page=${newPage}`);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        </div>;
    }

    if (error || !company) {
        return <div className="container mx-auto py-6 px-4 max-w-4xl">
            <p className="text-red-500">Error loading company data.</p>
        </div>;
    }

    return (
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/job-postings">Jobs</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{company.company_name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={company.logo} alt={company.company_name} />
                        <AvatarFallback>{company.company_name[0]}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold">{company.company_name}</h1>
                </div>

                {(company.hiring_url || company.hiring_url2 || company.hiring_url3) && (
                    <div className="space-y-2">
                        {[company.hiring_url, company.hiring_url2, company.hiring_url3]
                            .filter(Boolean)
                            .map((url, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-blue-600 hover:underline"
                                >
                                    {url}
                                </a>
                            ))}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Job Postings</h2>
                <JobList data={jobPostings} loading={loading} error={error} />

                {pagination && (
                    <Pagination>
                        <PaginationContent className="w-full justify-between">
                            <PaginationItem>
                                <PaginationLink
                                    className={cn(
                                        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
                                        buttonVariants({
                                            variant: "outline",
                                        }),
                                    )}
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    aria-label="Go to previous page"
                                    aria-disabled={pagination.current_page === 1}
                                >
                                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                                </PaginationLink>
                            </PaginationItem>

                            <PaginationItem>
                                <p className="text-sm text-muted-foreground" aria-live="polite">
                                    Page <span className="text-foreground">{pagination.current_page}</span> of{" "}
                                    <span className="text-foreground">{pagination.total_pages}</span>
                                </p>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationLink
                                    className={cn(
                                        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
                                        buttonVariants({
                                            variant: "outline",
                                        }),
                                    )}
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    aria-label="Go to next page"
                                    aria-disabled={pagination.current_page === pagination.total_pages}
                                >
                                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                                </PaginationLink>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </div>
    );
}
