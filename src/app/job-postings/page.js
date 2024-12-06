"use client";
import React, { memo, useState, Fragment, useEffect, use } from 'react';
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
import { ArrowRight, Search, Info, Sparkle, SparkleIcon, FilterX, Clock, Zap, X, Factory, Scroll } from "lucide-react";
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
import { useSearchParams } from 'next/navigation';
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


export const CompaniesSelect = memo(function CompaniesSelectBase({ companies, currentCompany, searchCompanyId }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
  
    const filteredCompanies = searchTerm
    ? companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : companies; // If searchTerm is empty, show all companies

    /* company
    100: {
    "id": 1866,
    "name": "Anyscale",
    "logo": "/src/Anyscalelogo.png"
}
    */
useEffect(() => {

    if (currentCompany && companies) {
      const foundCompany = companies.find(
        (company) => company.id === Number(currentCompany)
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
              className="w-full h-9 md:h-9 hover:bg-accent justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
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
                <span className="flex min-w-0 text-muted-foreground items-center gap-2">
                  <Factory strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span className="truncate">Companies</span>
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
                    height={300} // adjust height as needed
                    itemCount={filteredCompanies.length}
                    itemSize={40} // adjust item size as needed
                    width="100%"
                  >
                    {({ index, style }) => {
                      const company = filteredCompanies[index];
                      return (
                        <div style={style}>
                          <CommandItem
                            value={company.name}
                            onSelect={(currentValue) => {
                            searchCompanyId(company.id);
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

export const SearchInsightsSheet = memo(function SearchInsightsSheet({ isOpen, onClose, title, experienceLevel, location, company }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="sm" variant="outline">View Search Insights</Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md mx-auto sm:max-w-lg"> {/* Added responsive classes */}
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

export const ExperienceLevelSelect = memo(function ExperienceLevelSelect({ onChange, value }) {
    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="relative text-muted-foreground ps-9 h-9 md:h-9 w-[120px] text-sm md:text-sm rounded-lg border bg-background shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
            <Zap size={14} strokeWidth={2} aria-hidden="true" />
          </div>
          {value ? (
            <span className="text-foreground truncate font-semibold">
                <SelectValue placeholder={value} />
                </span>
            ) : (
                <SelectValue placeholder="Level" />
            )}
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Experience Level</SelectLabel>
                    <SelectItem value="null">Any</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="entry level">Entry Level / Associate</SelectItem>
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

export const LocationSelect = memo(function LocationSelect({ onChange, value }) {
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
            <SelectTrigger className="relative text-muted-foreground ps-9 h-9 md:h-9 w-[120px] text-sm   md:text-sm rounded-lg border bg-background shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
            <MapPin  size={14} strokeWidth={2} aria-hidden="true" />
          </div>
          {value ? (
            <span className="text-foreground truncate font-semibold">
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
                    className="peer pe-9 ps-12 h-12 rounded-xl" 
                    placeholder="Search..." 
                    type="search" 
                    value={searchValue} 
                    onChange={handleInputChange} 
                />
                <div className="pointer-events-none absolute z-1 inset-y-0 start-0 flex items-center justify-center ps-5 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Search size={16} strokeWidth={2} />
                </div>
                <button
                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center pr-4 justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Submit search"
                    type="button"
                    onClick={handleSearch}
                >
                    <ArrowRight id="loading-arrow" size={16} strokeWidth={2} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

export const MemoizedInput26 = memo(Input26);

export const SaveSearchButton = memo(function SaveSearchButton({ 
    title, 
    experienceLevel, 
    location, 
    savedSearches, 
    onSave, 
    className 
}) {
    // Check if current search parameters match any saved search
    const isAlreadySaved = savedSearches?.some(search => {
        const params = JSON.parse(search.search_params);
        return params.jobTitle === title && 
               params.experienceLevel === experienceLevel && 
               params.location === location;
    });

    if (isAlreadySaved) return null;

    // Only show save button if there are actual search parameters
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

export const CompanyInfo = memo(function CompanyInfo({ company, resetCompanyData }) { 
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

export const SearchSynonymsInfo = memo(function SearchSynonymsInfo({ title, synonyms }) {
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

const stripHTML = (str) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body.textContent || "";
  };
  
  export default function JobPostingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const enabled = false;
    const searchParams = useSearchParams();
  
    const [data, setData] = useState([]);
    const [title, setTitle] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [location, setLocation] = useState("");
    const [company, setCompany] = useState("");
    const limit = 20;
    const [savedSearches, setSavedSearches] = useState([]);
    const [currentController, setCurrentController] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [companyData, setCompanyData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [insightsShown, setInsightsShown] = useState(false);
    const [savedSearchesVisible, setSavedSearchesVisible] = useState(false);
    const [llmResponse, setLlmResponse] = useState("");
    const [companies, setCompanies] = useState([]);
  
    const predefinedQuestions = [
      "How can I improve my resume?",
      "What skills are in high demand?",
      "How to prepare for a job interview?",
    ];
  
    // Sync states from URL params
    useEffect(() => {
      const params = Object.fromEntries([...searchParams]);
      setTitle(params.title || "");
      setExperienceLevel(params.explevel || "");
      setLocation(params.location || "");
      setCompany(params.company || "");
      setCurrentPage(parseInt(params.page) || 1);
    }, [searchParams]);
  
    // Helper: Cancel current requests
    const cancelPendingRequests = () => {
      if (currentController) {
        currentController.abort();
      }
    };

    const resetCompanyData = () => {
        setCompanyData([]);
        const params = Object.fromEntries([...searchParams]);
        delete params.company;
        params.page = '1';
        router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
    };

    const searchCompanyId = (id) => {
        const params = Object.fromEntries([...searchParams]);
        params.company = id;
        params.page = '1';
        router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
    };
  
    // Helper: Fetch with cancellation
    const fetchWithCancel = async (url, options = {}) => {
      cancelPendingRequests();
      const controller = new AbortController();
      setCurrentController(controller);
  
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request cancelled');
          return null;
        }
        throw error;
      } finally {
        setCurrentController(null);
      }
    };
  
    // Builds a URL with updated page (or other params) while preserving existing query parameters
    function buildHref(pageNumber) {
      const params = Object.fromEntries([...searchParams]);
      params.page = pageNumber;
      return `/job-postings?${new URLSearchParams(params).toString()}`;
    }
  
    useEffect(() => {
      if (!loading) {
        const cacheKey = `jobPostings_${currentPage}_${title}_${experienceLevel}_${location}_${company}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheExpiry = 3600 * 1000; // 1 hour
        const now = Date.now();

        async function fetchCompanies() {
            try {
                const result = await fetchWithCancel(
                    `/api/companies`
                );
                if (result) {
                    setCompanies(result || []);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        }

        fetchCompanies();

        async function fetchCompanyData() {
            try {
                const result = await fetchWithCancel(
                    `/api/companies/${company}`
                );

                if (result) {
                    setCompanyData(result);
                }

            } catch (error) {
                console.error("Error fetching company data:", error);
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
            const result = await fetchWithCancel(
              `/api/job-postings?page=${currentPage}&limit=${limit}&title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}`
            );
            if (result) {
              setData(result.jobPostings || []);
              sessionStorage.setItem(cacheKey, JSON.stringify(result.jobPostings));
              sessionStorage.setItem(`${cacheKey}_timestamp`, now);
            }
          } catch (error) {
            console.error("Error fetching job postings:", error);
          }
        }
  
        const resetCache = () => {
          sessionStorage.removeItem(cacheKey);
          sessionStorage.removeItem(`${cacheKey}_timestamp`);
        };
  
        if (isCacheValid(cacheKey) && cachedData) {
          try {
            setData(JSON.parse(cachedData));
          } catch (error) {
            resetCache();
            fetchData();
            console.error("Error parsing cached job postings:", error);
          }
        } else {
          fetchData();
        }
      }
  
      return () => {
        cancelPendingRequests();
      };
    }, [user, loading, currentPage, title, experienceLevel, location, company]);
  
    useEffect(() => {
      if (!loading && user) {
        fetch('/api/saved-searches', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        })
          .then(response => response.json())
          .then(data => setSavedSearches(data.savedSearches))
          .catch(error => console.error('Error fetching saved searches:', error));
      }
    }, [user, loading]);
  
    const applySavedSearch = (searchParamsStr) => {
      const params = JSON.parse(searchParamsStr);
      const newParams = new URLSearchParams({
        title: params.jobTitle || '',
        explevel: params.experienceLevel || '',
        location: params.location || '',
        page: '1'
      });
      router.push(`/job-postings?${newParams.toString()}`);
    };
  
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
          toast({
            title: "Search saved",
            description: "Your search has been saved successfully.",
          });
        }
      } catch (error) {
        console.error('Error saving search:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save search. Please try again.",
        });
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
        const response = await fetch("http://localhost:1234/v1/chat/completions", {
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
        <MemoizedInput26 onSearch={(val) => {
          const params = Object.fromEntries([...searchParams]);
          params.title = val;
          params.page = '1';
          router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
        }} value={title} />
        
        <ScrollArea>
  <div className="flex w-full gap-3 pb-2 md:pb-4 ">
    {user && (
      <SaveSearchButton
        title={title}
        experienceLevel={experienceLevel}
        location={location}
        savedSearches={savedSearches}
        onSave={handleSaveSearch}
        className="whitespace-nowrap text-muted-foreground bg-muted h-9 rounded-lg border-none w-[30px]"
      />
    )}

    {(title || experienceLevel || location || company) && (
            <Button 
            variant="outline"  
            size="sm"
            onClick={() => {
              setCompanyData([]);
              setCompany("");
              router.push(`/job-postings`);
            }}
            className="whitespace-nowrap w-[30px] h-9 rounded-lg ml-auto"
          >
            <FilterX size={14} strokeWidth={1.5} />
          </Button>
    )}

    <Button 
      className={`h-9 md:h-9 size-sm shadow-sm border rounded-lg ${
        location === "remote" 
          ? "bg-blue-500/20 border-blue-600/20 text-blue-600 hover:bg-blue-500/30 hover:border-blue-600"
          : "bg-background text-muted-foreground hover:bg-blue-300/10 hover:border-blue-300"
      }`}
      onClick={() => {
        const params = Object.fromEntries([...searchParams]);
        params.location = location === "remote" ? "" : "remote";
        params.page = '1';
        router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
      }}
    >
      Remote
    </Button>
    <ExperienceLevelSelect 
      onChange={(value) => {
        const params = Object.fromEntries([...searchParams]);
        if (value === "null") {
          delete params.explevel;
        } else {
        params.explevel = value;
        }
        params.page = '1';
        router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
      }} 
      value={experienceLevel} 
    />
    <LocationSelect 
      onChange={(value) => {
        const params = Object.fromEntries([...searchParams]);
        if (value === "null") {
            delete params.location;
        } else {
        params.location = value;
        }
        params.page = '1';
        router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
      }} 
      value={location} 
    />
        <CompaniesSelect companies={companies} currentCompany={company} searchCompanyId={searchCompanyId} />

  </div>
  <ScrollBar orientation="horizontal"/>
</ScrollArea>
  
        {/* user buttons */}
        {user && enabled && (
          <>
            <div className="flex flex-row mb-2 gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/job-postings/applied')}>
                <BriefcaseBusiness size={16} strokeWidth={1.5} />
                <span>Applied</span>
              </Button>
              <SearchInsightsSheet title={title} />
            </div>
            <SaveSearchButton
              title={title}
              experienceLevel={experienceLevel}
              location={location}
              savedSearches={savedSearches}
              onSave={handleSaveSearch}
              className="whitespace-nowrap"
            />
          </>
        )}

        {companyData && companyData.name &&
        <CompanyInfo company={companyData} resetCompanyData={resetCompanyData} />
        }
  
        { savedSearchesVisible && savedSearches.length > 0 && (
          <div className="mt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold">Saved Searches</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/job-postings/saved-searches')}
                className="h-8 w-8 p-0"
              >
                <Plus size={16} strokeWidth={1.5} />
              </Button>
            </div>
            <div className="flex space-x-4 pb-2">
              {savedSearches.map((search) => {
                const params = JSON.parse(search.search_params);
                return (
                  <Badge
                    key={search.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => applySavedSearch(search.search_params)}
                  >
                    {params.jobTitle} • {params.experienceLevel} • {params.location}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
  
        {insightsShown && (
          <div>
            { predefinedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="mr-2 mb-2 shadow-none bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-foreground/10 text-muted-foreground/60"
                onClick={() => handlePredefinedQuestion(question)}
              >
                <SparkleIcon className="h-3 w-3 text-muted-foreground/60" />
                <p className="text-sm font-medium">{question}</p>
              </Button>
            ))}
          </div>
        )}
  
        {llmResponse && (
          <div className="mb-6 p-4 border rounded-md bg-gray-100">
            <div dangerouslySetInnerHTML={{ __html: llmResponse }} />
          </div>
        )}
  
        <div>
          {data && data.length > 0 ? (
            <div key="job-postings">
              <JobList data={data} />
            </div>
          ) : (
            <p>No job postings found. Adjust your search criteria.</p>
          )}
        </div>
  
        <div className="flex justify-between mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
              <PaginationPrevious 
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
  
              {/* Show ellipsis if current page is far from 1 */}
              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
  
              {/* Current page link (when greater than 1) */}
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

{data && data.length == limit && (
                            <PaginationItem>
                            <PaginationLink 
                              href={buildHref(currentPage+1)} 
                              
                            >
                              {currentPage+1}
                            </PaginationLink>
                          </PaginationItem>
                        )}    
  
              {/* Ellipsis before next link */}
              {data && data.length == limit && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
                )}
              
              {/* Next page link */}
              <PaginationItem>
                <PaginationNext href={data && data.length == limit ? buildHref(currentPage + 1) : undefined} disabled={data && data.length < limit} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    );
  }
  