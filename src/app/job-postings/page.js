"use client";
import React, { memo, useState, Fragment, useEffect, useCallback, useRef, Suspense } from 'react';
import { JobList } from "@/components/JobPostings";
import { JobPostingsChart } from "@/components/job-postings-chart";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowRight, Search, Info, ChevronLeft, SparkleIcon, Filter, Clock, Zap, X, Factory, Scroll, FilterX, Loader2, Map } from "lucide-react";
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
} from "@/components/ui/pagination"
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { BriefcaseBusiness } from "lucide-react";
import { useDebounce } from 'use-debounce';
import { MapPin } from 'lucide-react';

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus } from 'lucide-react';
import { Bookmark } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Check, ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FixedSizeList as List } from 'react-window';
import SearchParamsHandler from '@/components/SearchParamsHandler';


const states = {
  "null": "Any",
  "remote": "Remote",
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


function SavedSearchButton({ name, title, experienceLevel, location }) {
  const router = useRouter();

  // Function to get badge color based on search type
  const getBadgeColor = () => {
    if (title) return "bg-blue-500";
    if (experienceLevel) return "bg-emerald-500";
    if (location) return "bg-purple-500";
    return "bg-gray-500";
  };

  const redirectToSearch = () => {
    const params = {
      title: title || "",
      location: location || "",
      explevel: experienceLevel || ""
    };
    const newParams = new URLSearchParams(params);
    const newUrl = `/job-postings?${newParams.toString()}`;
    if (newUrl !== window.location.search) {
      router.push(newUrl);
    }
  };

  return (
    <Badge
      variant="outline"
      className="gap-1.5 cursor-pointer hover:bg-accent"
      onClick={redirectToSearch}
    >
      <span
        className={`size-1.5 rounded-full ${getBadgeColor()}`}
        aria-hidden="true"
      />
      {name}
    </Badge>
  );
}


const CompaniesSelect = memo(function CompaniesSelectBase({ companies, currentCompany, searchCompanyId }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = searchTerm
    ? companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : companies;

  useEffect(() => {
    if (currentCompany && companies) {
      const foundCompany = companies.find(
        (company) => company.name === currentCompany
      );
      if (foundCompany) {
        setValue(foundCompany.name);
      }
    } else {
      setValue("");
    }
  }, [currentCompany, companies]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="select-44"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="relative w-full items-center justify-between text-muted-foreground ps-4 rounded-lg border shadow-sm bg-background hover:bg-accent"
          >
            {value ? (
              <span className="flex min-w-0 items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={companies.find((c) => c.name === value)?.logo} />
                  <AvatarFallback>{value.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate font-semibold text-foreground">
                  {value}
                </span>
              </span>
            ) : (
              <span className="flex min-w-0 text-muted-foreground items-center gap-2">
                <span className="truncate">Company</span>
              </span>
            )}
            <ChevronDown
              size={16}
              strokeWidth={2}
              className="shrink-0 text-muted-foreground/80"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0 bg-white rounded-lg shadow-lg"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search companies..."
              value={searchTerm}
              onValueChange={(value) => setSearchTerm(value)}
              className="border-b px-4 py-2"
            />
            <CommandList>
              <CommandEmpty>No company found.</CommandEmpty>
              <CommandGroup heading="Companies">
                <List
                  height={300}
                  itemCount={filteredCompanies.length}
                  itemSize={40}
                  width="100%"
                >
                  {({ index, style }) => {
                    const company = filteredCompanies[index];
                    const isSelected = value === company.name;
                    return (
                      <div style={style} key={company.id}>
                        <CommandItem
                          value={company.name}
                          onSelect={(currentValue) => {
                            searchCompanyId(company.name);
                            setValue(currentValue);
                            setOpen(false);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                            } hover:bg-gray-100`}
                        >
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={company.logo} loading="lazy" />
                            <AvatarFallback>
                              {company.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{company.name}</span>
                          {isSelected && (
                            <Check size={16} strokeWidth={2} className="ml-auto text-green-500" />
                          )}
                        </CommandItem>
                      </div>
                    );
                  }}
                </List>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

const ExperienceLevelSelect = memo(function ExperienceLevelSelect({ onChange, value }) {
  const options = [
    {
      value: "any",
      label: "Any",
      description: "All experience levels welcome"
    },
    {
      value: "internship",
      label: "Internship",
      description: "Perfect for students and those seeking hands-on learning opportunities"
    },
    {
      value: "entry",
      label: "Entry Level / Associate",
      description: "0-2 years of experience, ideal for recent graduates"
    },
    {
      value: "junior",
      label: "Junior",
      description: "2-4 years of experience with proven skills"
    },
    {
      value: "senior",
      label: "Senior Level",
      description: "5+ years of experience with deep expertise"
    },
    {
      value: "lead",
      label: "Lead",
      description: "Technical leadership role guiding project direction"
    },
    {
      value: "manager",
      label: "Manager",
      description: "People management responsibilities with team oversight"
    },
    {
      value: "director",
      label: "Director",
      description: "Department-level leadership and strategic planning"
    },
    {
      value: "vp",
      label: "Vice President",
      description: "Executive leadership with organizational impact"
    },
    {
      value: "executive",
      label: "Executive",
      description: "C-level positions with company-wide influence"
    },
  ];

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="relative ps-4 rounded-lg border shadow-sm bg-background hover:bg-accent [&_[data-desc]]:hidden">
        {value ? (
          <span className="text-foreground truncate">
            <SelectValue placeholder={value} />
          </span>
        ) : (
          <SelectValue className="text-muted-foreground truncate" placeholder="Level" />
        )}
      </SelectTrigger>
      <SelectContent className="bg-background w-[250px] rounded-lg shadow-lg [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
        <SelectGroup>
          <SelectLabel>Experience Level</SelectLabel>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={`px-4 py-2 cursor-pointer ${value === option.value ? "text-foreground font-semibold" : "text-muted-foreground"
                } hover:bg-accent`}
            >
              {option.label}
              <span className="mt-1 block text-xs text-muted-foreground" data-desc>
                {option.description}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});

const LocationSelect = memo(function LocationSelect({ onChange, value }) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="relative text-muted-foreground ps-4 rounded-lg border border hover:bg-accent bg-background shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
        </div>
        {value ? (
          <span className="text-foreground truncate">
            <SelectValue placeholder={value} />
          </span>
        ) : (
          <SelectValue placeholder="Location" />
        )}
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
});

const SearchInsightsSheet = memo(function SearchInsightsSheet({ isOpen, onClose, title, experienceLevel, location, company }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">View Search Insights</Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-md mx-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Search Insights for {title}</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <JobPostingsChart
          title={title}
          experienceLevel={experienceLevel}
          location={location}
          company={company}
        />
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={onClose}>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

const JobCount = memo(function JobCount({ count, className }) {
  return (
    <span className={className}>
      <div className="flex items-center gap-2 text-sm mb-4 mt-3 font-mono text-muted-foreground">
        <span>{count} jobs</span>
      </div>
    </span>
  );
});

const CompanyInfo = memo(function CompanyInfo({ company, resetCompanyData, companies }) {
  console.log(company); // name of selected company
  console.log(companies); // array of companies {id, name, logo}
  if (!company) return null;
  if (!companies) return null;
  const companyObject = companies.find(c => c.name === company);
  if (!companyObject) return null;
  console.log(companyObject); // object of selected company

  return (
    <div className="z-[100] max-w-[400px] mb-4 rounded-lg border border-border bg-background px-4 py-3 shadow-lg shadow-black/5">
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={companyObject.logo} />
          <AvatarFallback>{companyObject.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium">
          Showing jobs at <strong className="font-semibold">{companyObject.name}</strong>
        </p>

        <Button
          variant="ghost"
          className="group -my-1.5 ml-auto -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
          aria-label="Close notification"
        >
          <X
            size={16}
            strokeWidth={2}
            className="opacity-60 transition-opacity group-hover:opacity-100 "
            aria-hidden="true"
          />
        </Button>
      </div>
    </div >
  );
});



const SearchSynonymsInfo = memo(function SearchSynonymsInfo({ title, synonyms }) {
  if (!title || !synonyms?.length) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
      <Info className="h-4 w-4" />
      <span>
        Including results for: {synonyms.map(s => s.related_title).join(', ')}
      </span>
    </div>
  );
});

export default function JobPostingsPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const enabled = false;

  const [data, setData] = useState([]);
  const [title, setTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [strictSearch, setStrictSearch] = useState(true);
  const [applyJobPrefs, setApplyJobPrefs] = useState(true);
  const [count, setCount] = useState(0);
  const limit = 20;
  const [savedSearches, setSavedSearches] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [companyData, setCompanyData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [insightsShown, setInsightsShown] = useState(false);
  const [savedSearchesVisible, setSavedSearchesVisible] = useState(false);
  const [llmResponse, setLlmResponse] = useState("");
  const [companies, setCompanies] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const predefinedQuestions = [
    "How can I improve my resume?",
    "What skills are in high demand?",
    "How to prepare for a job interview?",
  ];

  useEffect(() => {
    const currentParams = {
      title,
      experienceLevel,
      location,
      company,
      currentPage
    };
    sessionStorage.setItem('jobSearchParams', JSON.stringify(currentParams));
  }, [title, experienceLevel, location, company, currentPage]);

  const FilterPopover = ({ experienceLevel, location, company }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={`h-8 w-8 ${experienceLevel || location || company
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-600/30 dark:text-blue-300'
              : 'hover:bg-background/90 dark:hover:bg-muted/30'
              }`}
          >
            <Filter size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[280px] py-3 mr-4 mt-2 shadow-none" side="top">
          <div className="space-y-3">
            <div className="space-y-4">
              <p className="text-[13px] font-medium">Filter job postings</p>
              <p className="text-xs text-muted-foreground">
                Filter through over {count} job postings!
              </p>
              <div className="space-y-2">
                <div>
                  <span className="text-foreground">Company</span>
                  <p className="text-xs text-muted-foreground">Filter by specific company names</p>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                  <CompaniesSelect companies={companies} currentCompany={company} searchCompanyId={searchCompanyId} />
                </Suspense>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-foreground">Experience Level</span>
                  <p className="text-xs text-muted-foreground">Select required years of experience</p>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                  <ExperienceLevelSelect
                    onChange={(value) => {
                      const newExp = value === "any" ? "" : value;
                      if (newExp !== experienceLevel) {
                        const params = {
                          title,
                          explevel: newExp,
                          location,
                          company,
                          page: "1"
                        };
                        const newParams = new URLSearchParams(params);
                        const newUrl = `/job-postings?${newParams.toString()}`;
                        if (newUrl !== router.asPath) {
                          router.push(newUrl);
                        }
                      }
                    }}
                    value={experienceLevel}
                  />
                </Suspense>
              </div>

              {(title || experienceLevel || location || company) && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => {
                  setCompanyData([]);
                  setCompany("");
                  setTitle("");
                  setExperienceLevel("");
                  setLocation("");
                  setCurrentPage(1);
                  router.push(`/job-postings`);
                }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const fetchWithCancel = useCallback((url, options = {}) => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      const response = await fetch(url, { ...options, signal });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    };

    const promise = fetchData();
    return { promise, controller };
  }, []);

  const resetCompanyData = () => {
    setCompanyData([]);
    setCompany("");
    setCurrentPage(1);
    router.push(`/job-postings`);
  };

  const searchCompanyId = (id) => {
    if (id !== company) {
      setCompany(id);
      setCurrentPage(1);
      const params = {
        title,
        explevel: experienceLevel,
        location,
        company: id,
        page: '1'
      };
      const newParams = new URLSearchParams(params);
      const newUrl = `/job-postings?${newParams.toString()}`;
      if (newUrl !== router.asPath) {
        router.push(newUrl);
      }
    }
  };

  function JobPostingsPagination({ currentPage, count, limit }) {
    const totalPages = Math.ceil(count / limit);

    const handlePageChange = (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
        //Scroll to the top of the page when a new page is presented
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        setPageLoading(true);
        router.push(buildHref(pageNumber));
      }
    };

    return (
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
              href={buildHref(currentPage - 1)}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
              aria-label="Go to previous page"
              aria-disabled={currentPage === 1}
              role={currentPage === 1 ? "link" : undefined}
            >
              <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Page <span className="text-foreground">{currentPage}</span> of{" "}
              <span className="text-foreground">{totalPages}</span>
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
              href={buildHref(currentPage + 1)}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
              aria-label="Go to next page"
              aria-disabled={currentPage === totalPages}
              role={currentPage === totalPages ? "link" : undefined}
            >
              <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  function buildHref(pageNumber) {
    const params = {
      title,
      explevel: experienceLevel,
      location,
      strictSearch,
      company,
      // We still include applyJobPrefs in the URL for consistency across pagination:
      applyJobPrefs: applyJobPrefs.toString(),
      page: pageNumber.toString()
    };
    const newParams = new URLSearchParams(params);
    return `/job-postings?${newParams.toString()}`;
  }

  useEffect(() => {
    if (!dataLoading) {
      const cacheKey = `jobPostings_${currentPage}_${title}_${experienceLevel}_${location}_${company}_${strictSearch}_${applyJobPrefs}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = 3 * 60 * 1000;
      const now = Date.now();

      const fetchControllers = [];
      const cancelFetches = () => {
        fetchControllers.forEach(controller => controller.abort());
      };

      async function fetchCompanies() {
        try {
          const result = fetchWithCancel(`/api/companies`);
          fetchControllers.push(result.controller);
          const companiesResult = await result.promise;
          setCompanies(companiesResult || []);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching companies:", error);
          }
        }
      }

      fetchCompanies();

      async function fetchCompanyData() {
        try {
          const result = fetchWithCancel(`/api/companies/${company}`);
          fetchControllers.push(result.controller);
          const companyDataResult = await result.promise;
          setCompanyData(companyDataResult);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching company data:", error);
          }
        }
      }
      if (company) {
        fetchCompanyData();
      }

      const isCacheValid = (key) => {
        const cacheTimestamp = sessionStorage.getItem(`${key}_timestamp`);
        return cacheTimestamp && now - parseInt(cacheTimestamp, 10) < cacheExpiry;
      };

      async function fetchData() {
        try {
          setPageLoading(true);
          const result = fetchWithCancel(
            `/api/job-postings?page=${currentPage}&limit=${limit}&title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}&strictSearch=${strictSearch}&applyJobPrefs=${applyJobPrefs}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.token}`,
              },
            }
          );
          fetchControllers.push(result.controller);
          const dataResult = await result.promise;
          setData(dataResult.jobPostings || []);
          sessionStorage.setItem(cacheKey, JSON.stringify(dataResult.jobPostings));
          sessionStorage.setItem(`${cacheKey}_timestamp`, now);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching job postings:", error);
          }
        } finally {
          setPageLoading(false);
        }
      }

      async function fetchJobCount() {
        try {
          const result = fetchWithCancel(
            `/api/job-postings/count?title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}&strictSearch=${strictSearch}&applyJobPrefs=${applyJobPrefs}`,
            {
              headers: {
                'Authorization': `Bearer ${user?.token}`,
              },
            }
          );
          fetchControllers.push(result.controller);
          const countResult = await result.promise;
          setCount(countResult.totalJobs || 0);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching job count:", error);
          }
        }
      }

      if (isCacheValid(cacheKey) && cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setData(parsedData);
          setPageLoading(false);
          fetchJobCount();
        } catch (error) {
          console.error("Error parsing cached job postings:", error);
          fetchData();
          fetchJobCount();
        }
      } else {
        fetchData();
        fetchJobCount();
      }

      return () => {
        cancelFetches();
      };
    }
  }, [
    user,
    authLoading,
    dataLoading,
    currentPage,
    title,
    experienceLevel,
    location,
    company,
    strictSearch,
    applyJobPrefs,
    fetchWithCancel
  ]);

  useEffect(() => {
    if (!dataLoading && user) {
      fetch('/api/saved-searches', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
        .then(response => response.json())
        .then(data => setSavedSearches(data.savedSearches))
        .catch(error => console.error('Error fetching saved searches:', error));
    }
  }, [user, authLoading, dataLoading]);

  const applySavedSearch = (searchParamsStr) => {
    const params = JSON.parse(searchParamsStr);
    const newTitle = params.jobTitle || '';
    const newExp = params.explevel || '';
    const newLoc = params.location || '';
    setTitle(newTitle);
    setExperienceLevel(newExp);
    setLocation(newLoc);
    setCurrentPage(1);

    const newParams = {
      title: newTitle,
      explevel: newExp,
      location: newLoc,
      page: '1'
    };
    const qs = new URLSearchParams(newParams).toString();
    const newUrl = `/job-postings?${qs}`;
    if (newUrl !== router.asPath) {
      router.push(newUrl);
    }
  };

  const handleSearch = useCallback(
    (val) => {
      if (val !== title) {
        setTitle(val);
        setCurrentPage(1);
        const params = {
          title: val,
          explevel: experienceLevel,
          location,
          company,
          strict: strictSearch,
          applyJobPrefs: applyJobPrefs.toString(),
          page: '1'
        };
        const newParams = new URLSearchParams(params);
        const newUrl = `/job-postings?${newParams.toString()}`;
        if (newUrl !== router.asPath) {
          router.push(newUrl);
        }
      }
    },
    [experienceLevel, location, company, router, title, strictSearch, applyJobPrefs]
  );

  const handleSaveSearch = async () => {
    if (!user) return;

    const searchParamsObj = {
      jobTitle: title,
      experienceLevel: experienceLevel,
      location: location,
    };

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ searchParams: searchParamsObj }),
      });

      if (response.ok) {
        const newSavedSearch = await response.json();
        setSavedSearches([...savedSearches, newSavedSearch]);
        // toast logic here if you have toast
      }
    } catch (error) {
      console.error('Error saving search:', error);
      // toast destructive if needed
    }
  };

  const handlePredefinedQuestion = async (question) => {
    if (!user) return;

    if (!userProfile) {
      setLlmResponse("Loading user profile...");
      return;
    }

    const technicalSkills = userProfile.user.technical_skills || 'None specified';
    const softSkills = userProfile.user.soft_skills || 'None specified';
    const otherSkills = userProfile.user.other_skills || 'None specified';

    const systemMessage = {
      role: "system",
      content: `
You are a helpful career assistant. You are talking to ${userProfile.user.username}.
Here is their profile:

### Professional Summary
${userProfile.user.professionalSummary || 'No summary available.'}

### Work Experience
${userProfile.experience && userProfile.experience.length > 0
          ? userProfile.experience.map(exp =>
            `- **${exp.title}** at **${exp.companyName}** (${new Date(exp.startDate).toLocaleDateString()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()})
- **Location**: ${exp.location || 'Not specified'}
- **Description**: ${exp.description || 'No description available'}
- **Tags**: ${exp.tags || 'No tags available'}`).join('\n\n')
          : 'No work experience available.'
        }

### Education
${userProfile.education && userProfile.education.length > 0
          ? userProfile.education.map(edu =>
            `- **${edu.degree} in ${edu.fieldOfStudy}** from **${edu.institutionName}**
- **Duration**: ${new Date(edu.startDate).toLocaleDateString()} - ${edu.isCurrent ? 'Present' : new Date(edu.endDate).toLocaleDateString()}
- **Grade**: ${edu.grade || 'Not specified'}
- **Activities**: ${edu.activities || 'No activities specified'}`).join('\n\n')
          : 'No education details available.'
        }

### Skills
- **Technical Skills**: ${technicalSkills}
- **Soft Skills**: ${softSkills}
- **Other Skills**: ${otherSkills}

### Job Preferences
- **Desired Job Title**: ${userProfile.user.desired_job_title || 'Not specified'}
- **Preferred Location**: ${userProfile.user.desired_location || 'Any location'}
- **Preferred Salary**: $${userProfile.user.jobPreferredSalary || 'Not specified'}
- **Employment Type**: ${userProfile.user.employment_type || 'Not specified'}
- **Preferred Industries**: ${userProfile.user.preferred_industries || 'Not specified'}
- **Willing to Relocate**: ${userProfile.user.willing_to_relocate ? 'Yes' : 'No'}

Please provide relevant career advice and job search assistance based on their profile.
      `,
    };

    const userMessage = { role: "user", content: question };
    const newMessages = [systemMessage, userMessage];
    setLlmResponse("Loading...");

    try {
      const response = await fetch("http://192.168.86.240:1234/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2-0.5b-instruct",
          messages: newMessages,
          temperature: 0.7,
          max_tokens: 500,
          stream: false,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "No response.";
      setLlmResponse(content);
    } catch (error) {
      console.error("Error fetching LLM response:", error);
      setLlmResponse("Failed to get a response. Please try again.");
    }
  };

  const userSavedSearches = () => {
    router.push('/job-postings/saved-searches');
  };

  function Input26({ onSearch, value, userPreferredTitle = "" }) {
    const [searchValue, setSearchValue] = useState(value || "");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(null);
    const isFirstRender = useRef(true);

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Clear existing timer
        if (timer) {
          clearTimeout(timer);
        }
        setLoading(true);
        // Immediately set location on Enter
        onSearch(searchValue).finally(() => setLoading(false));
      }
    };

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setSearchValue(newValue);

      // If the search value is empty, trigger the search immediately
      if (newValue === "") {
        onSearch("");
      }
    };

    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      if (searchValue.trim() === "") {
        return;
      }

      setLoading(true);

      const handler = setTimeout(async () => {
        try {
          await onSearch(searchValue);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setLoading(false);
        }
      }, 5000); // increased to 5 seconds delay

      return () => {
        clearTimeout(handler);
      };
    }, [searchValue, onSearch]);

    useEffect(() => {
      setSearchValue(value || "");
    }, [value]);

    return (
      <div className="space-y-2 mb-2">
        <div className="relative">
          <Input
            id="input-26"
            className="peer pr-24 z-1 ps-9 h-10 rounded-xl text-[16px]"
            placeholder={userPreferredTitle && applyJobPrefs ? `Showing jobs for ${userPreferredTitle}` : "Search for a job title"}
            onKeyDown={handleKeyDown}
            type="search"
            value={searchValue}
            onChange={handleInputChange}
          />
          <Suspense fallback={<div>Loading...</div>}>
            {user && (
              <div className="absolute top-1/2 -translate-y-1/2 right-10 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Toggle job prefs and push new URL, same style as title/experience
                    const newValue = !applyJobPrefs;
                    setApplyJobPrefs(newValue);
                    setCurrentPage(1);
                    const params = {
                      title,
                      explevel: experienceLevel,
                      location,
                      company,
                      strict: strictSearch,
                      applyJobPrefs: newValue.toString(),
                      page: '1'
                    };
                    const newParams = new URLSearchParams(params);
                    const newUrl = `/job-postings?${newParams.toString()}`;
                    if (newUrl !== router.asPath) {
                      router.push(newUrl);
                    }
                  }}
                  className={cn(
                    "relative h-8 w-8 rounded-lg",
                    applyJobPrefs &&
                    "text-blue-600 bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-600/30 dark:text-blue-300"
                  )}
                >
                  <SparkleIcon size={14} className="" />
                </Button>
              </div>
            )}
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <span className="absolute top-1/2 -translate-y-1/2 right-0 mr-2">
              <FilterPopover experienceLevel={experienceLevel} location={location} company={company} />
            </span>
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-0 flex items-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <Search size={16} strokeWidth={2} />
            </div>
          </Suspense>
        </div>
      </div>
    );
  }

  function LocationSearch({ location, setLocation, userPreferredLocation = "", applyJobPrefs }) {
    const [searchValue, setSearchValue] = useState(location || "");
    const [timer, setTimer] = useState(null);

    // if userPreferredLocation is an array, use the first element
    if (Array.isArray(userPreferredLocation)) {
      userPreferredLocation = userPreferredLocation[0];
    }

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setSearchValue(newValue);

      // Clear any existing timer
      if (timer) {
        clearTimeout(timer);
      }

      // If the input is empty, set location to blank immediately
      if (newValue === "") {
        setLocation("");
        return;
      }

      // Set a new timer for non-empty values
      const newTimer = setTimeout(() => {
        setLocation(newValue);
      }, 5000);

      setTimer(newTimer);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        // Clear existing timer
        if (timer) {
          clearTimeout(timer);
        }
        // Immediately set location on Enter
        setLocation(searchValue);
      }
    };

    // Update local state when prop changes
    useEffect(() => {
      setSearchValue(location || "");
    }, [location]);

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [timer]);

    return (
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Input
            id="input-26"
            className="peer pr-24 z-1 ps-9 h-10 rounded-xl text-[16px]"
            placeholder={userPreferredLocation && applyJobPrefs ? `Showing jobs in ${userPreferredLocation}` : "Search for a location"}
            type="search"
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-0 flex items-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Map size={16} strokeWidth={2} />
          </div>
        </div>
      </div>
    );
  }

  const MemoizedInput26 = memo(Input26);
  const MemoizedLocationSearch = memo(LocationSearch);
  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        try {
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          const profile = await response.json();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    }

    fetchUserProfile();
  }, [user]);

  return (
    <>
      <title>{`junera ${title ? `| ${title}` : ''} ${location ? `in ${location}` : ''} ${company ? `at ${company}` : ''} | jobs`}</title>
      <meta name="description" content={`Find ${title || ''} jobs ${location ? 'in ' + location : ''} ${company ? 'at ' + company : ''}. Browse through job listings and apply today!`} />
      <meta name="robots" content="index, follow" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`junera ${title ? `| ${title}` : ''} ${location ? `in ${location}` : ''} ${company ? `at ${company}` : ''} | jobs`} />
      <meta property="og:description" content={`Find ${title || ''} jobs ${location ? 'in ' + location : ''} ${company ? 'at ' + company : ''}. Browse through job listings and apply today!`} />
      <meta property="og:url" content={`https://junera.us/job-postings${title ? `?title=${title}` : ''}${experienceLevel ? `&experienceLevel=${experienceLevel}` : ''}${location ? `&location=${location}` : ''}${company ? `&company=${company}` : ''}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://junera.us/job-postings${title ? `?title=${title}` : ''}${experienceLevel ? `&experienceLevel=${experienceLevel}` : ''}${location ? `&location=${location}` : ''}${company ? `&company=${company}` : ''}`
            },
            "name": `${title || 'junera'} ${location ? `in ${location}` : ''} ${company ? `at ${company} | jobs` : ''}`,
            "description": `Find ${title || ''} jobs ${location ? 'in ' + location : ''} ${company ? 'at ' + company : ''}. Browse through our comprehensive job listings.`,
            "datePosted": new Date().toISOString(),
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressRegion": location || "Multiple Locations"
              }
            },
            "hiringOrganization": company ? {
              "@type": "Organization",
              "name": company
            } : undefined,
            "employmentType": experienceLevel ? experienceLevel.toUpperCase() : "FULL_TIME",
            "numberOfPositions": count?.toString() || "multiple",
            "applicationContact": {
              "@type": "ContactPoint",
              "contactType": "jobs",
              "url": `https://junera.us/job-postings${title ? `?title=${title}` : ''}${experienceLevel ? `&experienceLevel=${experienceLevel}` : ''}${location ? `&location=${location}` : ''}${company ? `&company=${company}` : ''}`
            }
          }, null, 2),
        }}
      />
      <div className="container mx-auto py-5 md:py-10 px-4 max-w-4xl sm:px-8 lg:px-0 overflow-x-hidden w-full max-w-full md:max-w-4xl">
        <Suspense fallback={<div>Loading search parameters...</div>}>
          <SearchParamsHandler
            setTitle={setTitle}
            setExperienceLevel={setExperienceLevel}
            setLocation={setLocation}
            setCompany={setCompany}
            setCurrentPage={setCurrentPage}
            setApplyJobPrefs={setApplyJobPrefs}
          />
        </Suspense>
        <div className="z-0">
          <Suspense>
            <CompanyInfo company={company} resetCompanyData={resetCompanyData} companies={companies} />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <MemoizedInput26 onSearch={handleSearch} value={title} count={count} userPreferredTitle={user?.jobPrefsTitle} />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <MemoizedLocationSearch location={location} setLocation={setLocation} userPreferredLocation={user?.jobPrefsLocation} applyJobPrefs={applyJobPrefs} />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            {user && (
              <div className="flex w-full gap-3 justify-between items-center pb-0 md:pb-0 ">
                <h3 className="text-sm text-muted-foreground font-medium">
                  Saved Searches
                </h3>
                <Button variant="ghost" type="button" size="icon" onClick={userSavedSearches}>
                  <Plus size={16} strokeWidth={1.5} />
                </Button>
              </div>
            )}
          </Suspense>
          {user && (
            <Suspense fallback={<div>Loading...</div>}>
              <ScrollArea>
                <div className="flex flex-row items-center gap-4 mb-3">
                  {!dataLoading && user && savedSearches && savedSearches.length > 0 && (
                    savedSearches.map((search) => (
                      <SavedSearchButton
                        key={search.id}
                        name={search.search_name}
                        title={search.search_criteria.title}
                        experienceLevel={search.search_criteria.experienceLevel}
                        location={search.search_criteria.location}
                      />
                    ))
                  )}
                </div>
                <ScrollBar className="w-full" />
              </ScrollArea>
            </Suspense>
          )}
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          {user && enabled && (
            <>
              <div className="flex flex-row mb-2 gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/job-postings/applied')}>
                  <BriefcaseBusiness size={16} strokeWidth={1.5} />
                  <span>Applied</span>
                </Button>
                <SearchInsightsSheet title={title} />
              </div>
            </>
          )}

          <Suspense fallback={<div>Loading...</div>}>
            {companyData && companyData.name &&
              <CompanyInfo company={companyData} resetCompanyData={resetCompanyData} />
            }
          </Suspense>

          {llmResponse && (
            <Suspense fallback={<div>Loading...</div>}>
              <div className="mb-6 p-4 border rounded-md bg-gray-100">
                <div dangerouslySetInnerHTML={{ __html: llmResponse }} />
              </div>
            </Suspense>
          )}

          <div>
            {pageLoading ? (
              <div className="space-y-4">
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-6 bg-accent rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-accent rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : data && data.length > 0 ? (
              <div key="job-postings">
                <div className="items-center flex gap-4">
                  <span className="text-xs flex flex-row items-center gap-4 text-muted-foreground">
                    <div className="flex flex-col space-y-1">
                      {title && <span>Job Title: {title}</span>}
                      {experienceLevel && <span>Experience Level: {experienceLevel}</span>}
                    </div>
                  </span>
                </div>
                <JobList data={data} loading={pageLoading} error={null} />
              </div>
            ) : (
              <p>No job postings found. Adjust your search criteria.</p>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <JobPostingsPagination
                currentPage={currentPage}
                count={count}
                limit={limit}
              />
            </Suspense>
          </div>
        </Suspense>
      </div>
    </>
  );
}