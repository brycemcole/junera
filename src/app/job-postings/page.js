"use client";
import React, { memo, useState, useEffect } from 'react';
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
import { ArrowRight, Search, Info, Sparkle, SparkleIcon, FilterX, Clock, Zap, X } from "lucide-react";
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
                        Make changes to your profile here. Click save when you're done.
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
            <SelectTrigger className="relative text-muted-foreground  ps-9 h-[30px] w-[100px] text-xs rounded-lg border-transparent bg-muted dark:bg-neutral-900 shadow-none">

          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
            <Zap size={14} strokeWidth={2} aria-hidden="true" />
          </div>
                <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Experience Level</SelectLabel>
                    <SelectItem value="reset">Any</SelectItem>
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
            <SelectTrigger className="relative ps-9 w-[120px] text-muted-foreground text-xs rounded-lg h-[30px] border-transparent bg-muted dark:bg-neutral-900 shadow-none">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[[disabled]]:opacity-50">
            <MapPin  size={14} strokeWidth={2} aria-hidden="true" />
          </div>
                <SelectValue placeholder="Location" />
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
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-5 text-muted-foreground/80 peer-disabled:opacity-50">
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
        <div className="border rounded-lg shadow-sm px-2 py-2 mt-3 relative">
            <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
                <AvatarFallback>{company.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground font-medium">
                Showing jobs at <strong className="font-semibold text-foreground">{company.name}</strong></p>
            <X size={14} className="ml-auto cursor-pointer" onClick={resetCompanyData} />
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
    const [companySearch, setCompanySearch] = useState("");
    const [debouncedSearch] = useDebounce(companySearch, 300);
    const [savedSearches, setSavedSearches] = useState([]);
    const [currentController, setCurrentController] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [companyData, setCompanyData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [insightsShown, setInsightsShown] = useState(false);
    const [savedSearchesVisible, setSavedSearchesVisible] = useState(false);
    const [llmResponse, setLlmResponse] = useState("");
  
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
        params.company = "";
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
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <MemoizedInput26 onSearch={(val) => {
          const params = Object.fromEntries([...searchParams]);
          params.title = val;
          params.page = '1';
          router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
        }} value={title} />
        
        <ScrollArea>
          <div className="flex w-full gap-4 pb-2 md:pb-8">
            {user && (
              <SaveSearchButton
                title={title}
                experienceLevel={experienceLevel}
                location={location}
                savedSearches={savedSearches}
                onSave={handleSaveSearch}
                className="whitespace-nowrap text-muted-foreground bg-muted h-[30px] rounded-lg dark:bg-neutral-900 border-none w-[30px]"
              />
            )}
            <Button 
              className={`h-[30px] size-sm rounded-lg ${
                location === "remote" 
                    ? "bg-neutral-600 text-white hover:bg-neutral-800" 
                    : "bg-muted dark:bg-neutral-900 shadow-none hover:text-background hover:bg-neutral-500 dark:hover:text-foreground dark:hover:bg-neutral-700 text-muted-foreground"
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
                params.explevel = value;
                params.page = '1';
                router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
              }} 
              value={experienceLevel} 
            />
            <LocationSelect 
              onChange={(value) => {
                const params = Object.fromEntries([...searchParams]);
                params.location = value;
                params.page = '1';
                router.push(`/job-postings?${new URLSearchParams(params).toString()}`);
              }} 
              value={location} 
            />
            <Button 
              variant="outline"  
              size="sm"
              onClick={() => {
                router.push(`/job-postings`);
              }}
              className="whitespace-nowrap w-[30px] h-[30px] rounded-lg ml-auto"
            >
              <FilterX size={14} strokeWidth={1.5} />
            </Button>
          </div>
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
  