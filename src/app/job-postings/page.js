"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import SelectSearch from "@/components/select-search";
import Select47 from "@/components/multi-select";

import {
    Card,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { JobCard } from "@/components/job-posting";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { BriefcaseBusiness } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';

export function ExperienceLevelSelect({ onChange, value }) {
    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Experience Level" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Experience Level</SelectLabel>
                    <SelectItem value="internship">Internships</SelectItem>
                    <SelectItem value="entry">Entry Level / Associate</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="vp">Vice President</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}

export function LocationSelect({ onChange, value }) {
    const states = {
        "new york": "New York",
        "california": "California",
        "texas": "Texas",
        "florida": "Florida",
        "illinois": "Illinois",
        "pennsylvania": "Pennsylvania",
        "ohio": "Ohio",
        "georgia": "Georgia",
        "north carolina": "North Carolina",
        "michigan": "Michigan",
        "washington": "Washington",
        "arizona": "Arizona",
        "massachusetts": "Massachusetts",
        "tennessee": "Tennessee",
        "indiana": "Indiana",
        "missouri": "Missouri",
        "maryland": "Maryland",
        "wisconsin": "Wisconsin",
        "colorado": "Colorado",
        "minnesota": "Minnesota",
        "south carolina": "South Carolina",
        "alabama": "Alabama",
        "louisiana": "Louisiana",
        "kentucky": "Kentucky",
        "oregon": "Oregon",
        "oklahoma": "Oklahoma",
        "connecticut": "Connecticut",
        "iowa": "Iowa",
        "utah": "Utah",
        "nevada": "Nevada",
        "arkansas": "Arkansas",
        "mississippi": "Mississippi",
        "kansas": "Kansas",
        "new mexico": "New Mexico",
        "nebraska": "Nebraska",
        "west virginia": "West Virginia",
        "idaho": "Idaho",
        "hawaii": "Hawaii",
        "new hampshire": "New Hampshire",
        "maine": "Maine",
        "montana": "Montana",
        "rhode island": "Rhode Island",
        "delaware": "Delaware",
        "south dakota": "South Dakota",
        "north dakota": "North Dakota",
        "alaska": "Alaska",
        "vermont": "Vermont",
        "wyoming": "Wyoming",
    };

    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>State</SelectLabel>
                    {Object.entries(states).map(([stateValue, stateName]) => (
                        <SelectItem key={stateValue} value={stateValue}>
                            {stateName}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}

export function Input26({ onSearch, value }) {
    const [searchValue, setSearchValue] = useState(value || "");

    const handleInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    const handleSearch = () => {
        onSearch(searchValue);
    };

    useEffect(() => {
        setSearchValue(value || "");
    }, [value]);

    return (
        <div className="space-y-2 mb-4">
            <div className="relative">
                <Input 
                    id="input-26" 
                    className="peer pe-9 ps-9" 
                    placeholder="Search..." 
                    type="search" 
                    value={searchValue} 
                    onChange={handleInputChange} 
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Search size={16} strokeWidth={2} />
                </div>
                <button
                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Submit search"
                    type="button"
                    onClick={handleSearch}
                >
                    <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

export default function JobPostingsPage() {
    const { user, loading } = useAuth(); // Destructure loading
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [title, setTitle] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [location, setLocation] = useState("");
    const [company, setCompany] = useState("");
    const limit = 20;
    const [companies, setCompanies] = useState([]);
    const [companySearch, setCompanySearch] = useState("");
    const [debouncedSearch] = useDebounce(companySearch, 300);

    // Add a computed variable for filter text
    const filterText = [
        title && `Title: ${title}`,
        experienceLevel && `Experience: ${experienceLevel}`,
        location && `Location: ${location}`,
        company && `Company: ${companies.find(c => c.id === company)?.name || company}`,
    ].filter(Boolean).join(', ');

    useEffect(() => {
        if (!loading) { 
            if (!user) {
                router.push('/login');
            } else {
                // Fetch totalJobs whenever filters change
                const cacheKeyTotal = `totalJobs_${title}_${experienceLevel}_${location}_${company}`;
                const cachedTotal = sessionStorage.getItem(cacheKeyTotal);

                if (cachedTotal) {
                    setTotalJobs(parseInt(cachedTotal, 10));
                } else {
                    async function fetchTotalJobs() {
                        try {
                            const response = await fetch(`/api/job-postings/count?title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}`, {
                                headers: {
                                    'Authorization': `Bearer ${user.token}`,
                                },
                            });
                            const result = await response.json();
                            setTotalJobs(result.totalJobs);
                            sessionStorage.setItem(cacheKeyTotal, result.totalJobs);
                        } catch (error) {
                            console.error("Error fetching total jobs:", error);
                        }
                    }
                    fetchTotalJobs();
                }

                const cacheKey = `jobPostings_${currentPage}_${title}_${experienceLevel}_${location}_${company}`;
                const cachedData = sessionStorage.getItem(cacheKey);

                if (cachedData) {
                    setData(JSON.parse(cachedData));
                } else {
                    async function fetchData() {
                        try {
                            const response = await fetch(`/api/job-postings?page=${currentPage}&limit=${limit}&title=${title}&experienceLevel=${experienceLevel}&location=${location}&company=${company}`, {
                                headers: {
                                    'Authorization': `Bearer ${user.token}`,
                                },
                            });
                            const result = await response.json();
                            console.log("Fetched job postings:", result);
                            setData(result.jobPostings);
                            sessionStorage.setItem(cacheKey, JSON.stringify(result.jobPostings));
                        } catch (error) {
                            console.error("Error fetching job postings:", error);
                        }
                    }
                    fetchData();
                }
            }
        }
    }, [user, loading, router, currentPage, title, experienceLevel, location, company]);

    useEffect(() => {
        const params = Object.fromEntries([...searchParams]);
        setTitle(params.title || "");
        setExperienceLevel(params.explevel || "");
        setLocation(params.location || "");
        setCompany(params.company || "");
        setCurrentPage(parseInt(params.page) || 1);
    }, [searchParams]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (title) params.set('title', title);
        if (experienceLevel) params.set('explevel', experienceLevel);
        if (location) params.set('location', location);
        if (company) params.set('company', company);
        params.set('page', currentPage);
        router.push(`/job-postings/?${params.toString()}`);
    }, [title, experienceLevel, location, company, currentPage]);

    useEffect(() => {
        async function fetchCompanies() {
            try {
                const response = await fetch(`/api/companies?search=${debouncedSearch}`);
                const result = await response.json();
                setCompanies(result);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        }
        fetchCompanies();
    }, [debouncedSearch]);

    const handleNextPage = () => {
        setCurrentPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    const handleSearch = (searchValue) => {
        setTitle(searchValue);
    };

    const handleExperienceLevelChange = (value) => {
        setExperienceLevel(value);
    };

    const handleLocationChange = (value) => {
        setLocation(value);
    };

    const handleCompanyChange = (value) => {
        setCompany(value);
    };

    const handleCompanySearch = (e) => {
        setCompanySearch(e.target.value);
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Breadcrumb className="mb-4">
        <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/job-postings">Jobs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
  </BreadcrumbList>
</Breadcrumb>

            <h1 className="text-2xl font-bold mb-4">
                {totalJobs} Job Postings{filterText && ` - ${filterText}`}
            </h1>
                        {user && (
                            <>
                <div className="flex flex-row mb-2 gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/job-postings/applied')}>
                      <BriefcaseBusiness size={16} strokeWidth={1.5} />
                        <span>Applied</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/job-postings/saved-searches')}>
                      <Search size={16} strokeWidth={1.5} />
                        <span>Saved Searches</span>
                    </Button>
                    </div>
                    
                    </>
                
            )}
            <Input26 onSearch={handleSearch} value={title} />
            <div className="flex space-x-4 overflow-x-auto">
                <ExperienceLevelSelect onChange={handleExperienceLevelChange} value={experienceLevel} />
                <LocationSelect onChange={handleLocationChange} value={location} />
                <Select onValueChange={handleCompanyChange} value={company}>
                    <SelectTrigger className="w-[180px]">
                        <Input 
                            placeholder="Search Company" 
                            value={companySearch} 
                            onChange={handleCompanySearch} 
                            className="w-full"
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Company</SelectLabel>
                            {companies.map(company => (
                                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="mt-4">
                {data.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>
            <div className="flex justify-between mt-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" onClick={handlePreviousPage} disabled={currentPage === 1} />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#" onClick={() => setCurrentPage(1)} isActive={currentPage === 1}>1</PaginationLink>
                        </PaginationItem>
                        {currentPage > 1 && (
                            <PaginationItem>
                                <PaginationLink href="#" isActive>{currentPage}</PaginationLink>
                            </PaginationItem>
                        )}
                        {currentPage > 1 && (
                            <PaginationItem>
                                <PaginationLink href="#" onClick={() => setCurrentPage(currentPage + 1)}>{currentPage + 1}</PaginationLink>
                            </PaginationItem>
                        )}
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" onClick={handleNextPage} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}
