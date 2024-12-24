"use client";
import React, { memo, useState, Fragment, useEffect, useCallback, useRef, Suspense } from 'react';
import { JobList } from "@/components/JobPostings";
import { JobPostingsChart } from "@/components/job-postings-chart";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
import { ArrowRight, Search, Info, SparkleIcon, Filter, Clock, Zap, X, Factory, Scroll, FilterX, Loader2 } from "lucide-react";
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

function SavedSearchButton({ name, title, experienceLevel, location }) {
  const router = useRouter();
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
    <Button
      className="group h-auto gap-4 py-3 bg-background text-left shadow-sm hover:shadow-md transition-shadow duration-300"
      variant="outline"
      onClick={redirectToSearch}
    >
      <div className="space-y-1 w-[200px]">
        <p className="text-sm">{name}</p>
        <p className="text-muted-foreground text-wrap truncate line-clamp-2 text-xs">
          <strong className="text-foreground">{title || 'Any'}</strong> jobs in <strong className="text-foreground">{location || 'Any location'}</strong> requiring <strong className="text-foreground">{experienceLevel || 'Any'}</strong> experience level.
        </p>
      </div>
      <ChevronRight
        className="opacity-60 transition-transform group-hover:translate-x-0.5"
        size={16}
        strokeWidth={2}
        aria-hidden="true"
      />
    </Button>
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
            className="relative text-muted-foreground ps-4 h-7 md:h-9 text-md md:text-xs rounded-lg border border shadow-sm"
          >
            {value ? (
              <span className="flex min-w-0 items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={companies.find((c) => c.name === value)?.logo} />
                  <AvatarFallback>{value.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate font-semibold">{value}</span>
              </span>
            ) : (
              <span className="flex min-w-0 text-foreground items-center gap-2">
                <span className="truncate text-xs">Company</span>
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
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search companies..."
              value={searchTerm}
              onValueChange={(value) => setSearchTerm(value)}
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
                    return (
                      <div style={style}>
                        <CommandItem
                          value={company.name}
                          onSelect={(currentValue) => {
                            searchCompanyId(company.name);
                            setValue(currentValue);
                            setOpen(false);
                          }}
                        >
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={company.logo} loading="lazy" />
                            <AvatarFallback>
                              {company.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {company.name}
                          {value === company.name && (
                            <Check size={16} strokeWidth={2} className="ml-auto" />
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


const ExperienceLevelSelect = memo(function ExperienceLevelSelect({ onChange, value }) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="relative ps-4 h-7 md:h-9 text-xs rounded-lg border border bg-background shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 group-has-[[disabled]]:opacity-50">
        </div>
        {value ? (
          <span className="text-foreground truncate text-xs font-medium">
            <SelectValue placeholder={value} />
          </span>
        ) : (
          <SelectValue className="text-foreground truncate text-xs font-medium" placeholder="Level" />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Experience Level</SelectLabel>
          <SelectItem value="any">Any</SelectItem> {/* Changed from "" to "any" */}
          <SelectItem value="internship">Internship</SelectItem>
          <SelectItem value="entry">Entry Level / Associate</SelectItem>
          <SelectItem value="junior">Junior</SelectItem>
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
});

const LocationSelect = memo(function LocationSelect({ onChange, value }) {
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

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="relative text-muted-foreground ps-4 h-7 md:h-9 text-md md:text-sm rounded-lg border border bg-background shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
        </div>
        {value ? (
          <span className="text-foreground text-xs truncate font-medium">
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

const JobCount = memo(function JobCount({ count, className }) {
  return (
    <span className={className}>
      <div className="flex items-center gap-2 text-sm mb-4 mt-3 font-mono text-muted-foreground">
        <span>{count} jobs</span>
      </div>
    </span>
  );
});

const SaveSearchButton = memo(function SaveSearchButton({
  title,
  experienceLevel,
  location,
  savedSearches,
  onSave,
  className
}) {
  const isAlreadySaved = savedSearches?.some(search => {
    const params = JSON.parse(search.search_params);
    return params.jobTitle === title &&
      params.explevel === experienceLevel &&
      params.location === location;
  });

  if (isAlreadySaved) return null;
  if (!title && !experienceLevel && !location) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onSave}
      className={className}
    >
      <Bookmark className="h-3 w-3" />
    </Button>
  );
});

const CompanyInfo = memo(function CompanyInfo({ company, resetCompanyData }) {
  return (
    <div className="border rounded-lg shadow-sm px-2 py-2 mt-3 mb-0 md:mb-4 md:mt-0 relative">
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback>{company.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground font-medium">
          Showing jobs at <Link href={`/companies/${company.id}`}>
            <strong className="font-semibold text-foreground">{company.name}</strong>
          </Link>
        </p>
        <X size={14} className="ml-auto mr-2 cursor-pointer" onClick={resetCompanyData} />
      </div>
    </div>
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
          <Button variant="ghost" className={`h-8 ${experienceLevel || location || company ? 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-800/30' : ' '}`}>
            <Filter size={14} className="mr-2" />
            Filter
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[280px] py-3 mr-4 mt-2 shadow-none" side="top">
          <div className="space-y-3">
            <div className="space-y-4">
              <p className="text-[13px] font-medium">Filter job postings</p>
              <p className="text-xs text-muted-foreground">
                Filter through over {count} job postings!
              </p>
              <div className="grid grid-cols-2 items-center gap-2">
                <span className="text-foreground text-xs">Company</span>
                <Suspense fallback={<div>Loading...</div>}>
                  <CompaniesSelect companies={companies} currentCompany={company} searchCompanyId={searchCompanyId} />
                </Suspense>
              </div>

              <div className="grid grid-cols-2 items-center gap-2">
                <span className="text-foreground text-xs">Experience Level</span>
                <Suspense fallback={<div>Loading...</div>}>
                  <ExperienceLevelSelect
                    onChange={(value) => {
                      const newExp = value === "any" ? "" : value; // Ensure empty string for 'Any'
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
              <div className="grid grid-cols-2 items-center gap-2">
                <span className="text-foreground text-xs">Location</span>
                <LocationSelect
                  onChange={(value) => {
                    const newLoc = value === "null" ? "" : value;
                    if (newLoc !== location) {
                      const params = {
                        title,
                        explevel: experienceLevel,
                        location: newLoc,
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
                  value={location}
                />
              </div>
              {(title || experienceLevel || location || company) && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => {
                  setCompanyData([]);
                  setCompany("");
                  setTitle("");
                  setExperienceLevel("");
                  setLocation("");
                  setCurrentPage(1);
                  // This is a user action; pushing once should be okay
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
    // Remove shared currentControllerRef
    return { promise, controller };
  }, []);


  const resetCompanyData = () => {
    setCompanyData([]);
    setCompany("");
    setCurrentPage(1);
    // user action again, one-time push is okay
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

  function buildHref(pageNumber) {
    const params = {
      title,
      explevel: experienceLevel,
      location,
      company,
      page: pageNumber.toString()
    };
    const newParams = new URLSearchParams(params);
    return `/job-postings?${newParams.toString()}`;
  }

  useEffect(() => {
    if (!dataLoading) {
      const cacheKey = `jobPostings_${currentPage}_${title}_${experienceLevel}_${location}_${company}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = 3 * 60 * 1000;
      const now = Date.now();

      // Define fetchControllers and cancelFetches within this useEffect
      const fetchControllers = []; // Add this line
      const cancelFetches = () => { // Add this block
        fetchControllers.forEach(controller => controller.abort());
      };

      async function fetchCompanies() {
        try {
          const result = fetchWithCancel(`/api/companies`);
          fetchControllers.push(result.controller); // Use fetchControllers here
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
          fetchControllers.push(result.controller); // Use fetchControllers here
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
          const result = fetchWithCancel(
            `/api/job-postings?page=${currentPage}&limit=${limit}&title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}`
          );
          fetchControllers.push(result.controller); // Use fetchControllers here
          const dataResult = await result.promise;
          setData(dataResult.jobPostings || []);
          sessionStorage.setItem(cacheKey, JSON.stringify(dataResult.jobPostings));
          sessionStorage.setItem(`${cacheKey}_timestamp`, now);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching job postings:", error);
          }
        }
      }

      async function fetchJobCount() {
        try {
          const result = fetchWithCancel(
            `/api/job-postings/count?title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}`
          );
          fetchControllers.push(result.controller); // Use fetchControllers here
          const countResult = await result.promise;
          setCount(countResult.totalJobs || 0);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching job count:", error);
          }
        }
      }

      const resetCache = () => {
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(`${cacheKey}_timestamp`);
      };

      if (isCacheValid(cacheKey) && cachedData) {
        try {
          setData(JSON.parse(cachedData));
          fetchJobCount();
        } catch (error) {
          resetCache();
          fetchData();
          fetchJobCount();
          console.error("Error parsing cached job postings:", error);
        }
      } else {
        fetchData();
        fetchJobCount();
      }

      return () => { // Add this block
        cancelFetches();
      };
    }

  }, [user, authLoading, dataLoading, currentPage, title, experienceLevel, location, company, fetchWithCancel]);

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
          page: '1'
        };
        const newParams = new URLSearchParams(params);
        const newUrl = `/job-postings?${newParams.toString()}`;
        if (newUrl !== router.asPath) {
          router.push(newUrl);
        }
      }
    },
    [experienceLevel, location, company, router, title]
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
          : 'No work experience available.'}

### Education
${userProfile.education && userProfile.education.length > 0
          ? userProfile.education.map(edu =>
            `- **${edu.degree} in ${edu.fieldOfStudy}** from **${edu.institutionName}**
- **Duration**: ${new Date(edu.startDate).toLocaleDateString()} - ${edu.isCurrent ? 'Present' : new Date(edu.endDate).toLocaleDateString()}
- **Grade**: ${edu.grade || 'Not specified'}
- **Activities**: ${edu.activities || 'No activities specified'}`).join('\n\n')
          : 'No education details available.'}

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
    // user action - one-time push
    router.push('/job-postings/saved-searches');
  };
  
  function Input26({ onSearch, value, count }) {
  const [searchValue, setSearchValue] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
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
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue, onSearch]);

  useEffect(() => {
    setSearchValue(value || "");
  }, [value]);

  return (
    <div className="space-y-2 mb-4">
      <div className="relative">
        <Input
          id="input-26"
          className="peer pr-24 z-1 ps-9 h-12 rounded-xl text-[16px]"
          placeholder="Search..."
          type="search"
          value={searchValue}
          onChange={handleInputChange}
        />
        <Suspense fallback={<div>Loading...</div>}>
          <span className="absolute top-0 right-0 mr-4">
                  <FilterPopover experienceLevel={experienceLevel} location={location} company={company} />
                  </span>
                </Suspense>
        
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          {loading ? (
            <Loader2 className="animate-spin" size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Search size={16} strokeWidth={2} />
          )}
        </div>
      </div>
    </div>
  );
}

const MemoizedInput26 = memo(Input26);

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
    <div className="container mx-auto py-10 px-4 max-w-4xl md:px-0">
      <Suspense fallback={<div>Loading search parameters...</div>}>
        <SearchParamsHandler
          setTitle={setTitle}
          setExperienceLevel={setExperienceLevel}
          setLocation={setLocation}
          setCompany={setCompany}
          setCurrentPage={setCurrentPage}
        />
      </Suspense>
      <div className="z-0">
        <MemoizedInput26 onSearch={handleSearch} value={title} count={count} />
        <Suspense fallback={<div>Loading...</div>}>
          {user && (
            <div className="flex w-full gap-3 justify-between items-center pb-2 md:pb-0 ">
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
              <div className="flex flex-row items-center gap-4 mb-6">
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
          {data && data.length > 0 ? (
            <div key="job-postings">
              <div className="items-center flex gap-4">
                <span className="text-xs flex flex-row items-center gap-4 text-muted-foreground">
                  <div className="flex flex-col space-y-1">
                    {title && <span>Job Title: {title}</span>}
                    {experienceLevel && <span>Experience Level: {experienceLevel}</span>}
                    {location && <span>Location: {location}</span>}
                  </div>
                </span>
              </div>
              <JobList data={data} />
            </div>
          ) : (
            <p>No job postings found. Adjust your search criteria.</p>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Suspense fallback={<div>Loading...</div>}>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        router.push(buildHref(currentPage - 1));
                      }
                    }}
                    href={currentPage > 1 ? buildHref(currentPage - 1) : undefined}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href={buildHref(1)}
                    isActive={currentPage === 1}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>

                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href={buildHref(currentPage)}
                      isActive
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                )}

                {data && data.length === limit && (
                  <PaginationItem>
                    <PaginationLink
                      href={buildHref(currentPage + 1)}
                    >
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}

                {data && data.length === limit && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      if (data && data.length === limit) {
                        router.push(buildHref(currentPage + 1));
                      }
                    }}
                    href={data && data.length === limit ? buildHref(currentPage + 1) : undefined}
                    disabled={data && data.length < limit}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Suspense>
        </div>
      </Suspense>
    </div>
  );
}
