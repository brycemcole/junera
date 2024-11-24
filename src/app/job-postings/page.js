"use client";
import React, { memo, useState, useEffect } from 'react';
import { formatDistanceToNow } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { JobPostingsChart } from "@/components/job-postings-chart";
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
import { ArrowRight, Search, Info } from "lucide-react";
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
import { User } from 'lucide-react';
import { Bot } from 'lucide-react';
import { Send } from 'lucide-react';
import { Briefcase } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { Settings } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus } from 'lucide-react';
import { X } from 'lucide-react';
import { Bookmark } from 'lucide-react';

export const SearchInsightsSheet = memo(function SearchInsightsSheet({ isOpen, onClose, title, experienceLevel, location, company }) {
    return (
        <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" variant="outline">View Search Insights</Button>
        </SheetTrigger>
        <SheetContent>
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
            <SelectTrigger className="h-8 w-[180px]">
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
});

export const LocationSelect = memo(function LocationSelect({ onChange, value }) {
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
            <SelectTrigger className="w-[180px] h-8">
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

export const MemoizedInput26 = memo(Input26);

const LLMChat = memo(function LLMChat({ user }) {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [llmResponse, setLlmResponse] = useState("");
    const [userProfile, setUserProfile] = useState(null);
    const [showSystemMessage, setShowSystemMessage] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(false);

    const toggleChatVisibility = () => {
        setIsChatVisible(!isChatVisible);
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
        
                    // Extract skills as strings
                    const technicalSkills = profile.user.technical_skills || 'None specified';
                    const softSkills = profile.user.soft_skills || 'None specified';
                    const otherSkills = profile.user.other_skills || 'None specified';
        
                    // Create a detailed system message with profile information
                    const systemMessage = {
                        role: "system",
                        content: `
        You are a helpful career assistant. You are talking to ${user.username}.
        Here is their profile:
        
        ### Professional Summary
        ${profile.user.professionalSummary || 'No summary available.'}
        
        ### Work Experience
        ${profile.experience && profile.experience.length > 0 
            ? profile.experience.map(exp => 
                `- **${exp.title}** at **${exp.companyName}** (${new Date(exp.startDate).toLocaleDateString()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()})
          - **Location**: ${exp.location || 'Not specified'}
          - **Description**: ${exp.description || 'No description available'}
          - **Tags**: ${exp.tags || 'No tags available'}`).join('\n\n')
            : 'No work experience available.'}
        
        ### Education
        ${profile.education && profile.education.length > 0
            ? profile.education.map(edu => 
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
        - **Desired Job Title**: ${profile.user.desired_job_title || 'Not specified'}
        - **Preferred Location**: ${profile.user.desired_location || 'Any location'}
        - **Preferred Salary**: $${profile.user.jobPreferredSalary || 'Not specified'}
        - **Employment Type**: ${profile.user.employment_type || 'Not specified'}
        - **Preferred Industries**: ${profile.user.preferred_industries || 'Not specified'}
        - **Willing to Relocate**: ${profile.user.willing_to_relocate ? 'Yes' : 'No'}
        
        Please provide relevant career advice and job search assistance based on their profile.
                        `,
                    };
        
                    setMessages([systemMessage]);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    // Fallback to basic system message if profile fetch fails
                    setMessages([{
                        role: "system",
                        content: `You are a helpful assistant. You are talking to ${user.username}. They are looking for job opportunities.`,
                    }]);
                }
            }
        }
        
        fetchUserProfile();
    }, [user]);

    const handleLLMRequest = async () => {
        if (!userInput.trim()) return;
        
        const newMessages = [...messages, { role: "user", content: userInput }];
        setMessages(newMessages);
        setUserInput("");
        
        try {
            const response = await fetch("http://localhost:1234/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.2-3b-instruct",
                    messages: newMessages,
                    temperature: 0.7,
                    max_tokens: -1,
                    stream: true,
                }),
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.trim().split('\n');
                
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    
                    const dataStr = line.replace(/^data: /, '');
                    if (dataStr === '[DONE]') break;
                    
                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices[0].delta.content;
                        if (content) {
                            fullText += content;
                            setLlmResponse(fullText);
                        }
                    } catch (error) {
                        console.error("Error parsing JSON:", error);
                    }
                }
            }
            setMessages([...newMessages, { role: "assistant", content: fullText }]);
        } catch (error) {
            console.error("Error:", error);
        }
    };
    const resetChat = () => {
        if (user) {
            setMessages([{
                role: "system",
                content: `You are a helpful assistant. You are talking to ${user.username}. They are looking for job opportunities.`
            }]);
        }
        setUserInput("");
        setLlmResponse("");
    };

    // Don't render if no messages (which means no user context yet)
    if (messages.length === 0) return null;
    const toggleSystemMessage = () => {
        setShowSystemMessage(showSystemMessage);
    };

    return (
        <div>
            {/* Chat Toggle Button */}
            <Button
                onClick={toggleChatVisibility}
                className="fixed bg-accent/50 border text-primary bottom-4 right-4 shadow-lg z-50 hover:bg-accent/60 pointer-events-auto"
            >
                {isChatVisible ? "Close Chat" : "Chat with Assistant"}
            </Button>

            {/* Chat Window */}
            {isChatVisible && (
                <div
                    className="fixed bottom-16 right-4 w-full max-w-xs sm:max-w-md border rounded-lg shadow-lg border bg-background z-50"
                >
                    {/* Chat Header */}
                    <div className=" text-white rounded-xl p-2 font-bold flex justify-between items-center">
                        <span>Chat with Assistant</span>
                        <button
                            className="text-foreground"
                            onClick={toggleChatVisibility}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div
                        className="p-4 overflow-y-auto"
                        style={{ maxHeight: '300px' }}
                    >
                        {messages.length === 0 ? (
                            <p className="text-gray-500">Start the conversation...</p>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`mb-2 flex ${
                                        msg.role === 'assistant'
                                            ? 'justify-start'
                                            : 'justify-end'
                                    }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg text-sm ${
                                            msg.role === 'assistant'
                                                ? 'border border-blue-100 text-blue-800 dark:border-blue-800 dark:text-blue-100'
                                                : 'border border-green-100 text-green-800 dark:border-green-800 dark:text-green-100'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex items-center p-3 border-t bg-background">
                        <Input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                        />
                        <Button
                            onClick={() => {
                                setMessages([
                                    ...messages,
                                    { role: 'user', content: userInput },
                                ]);
                                setUserInput('');
                            }}
                            className="ml-2 text-sm bg-background text-primary hover:bg-accent/50"
                            disabled={!userInput.trim()}
                        >
                            <Send size={16} strokeWidth={1.5} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});

export const SaveSearchButton = memo(function SaveSearchButton({ 
    title, 
    experienceLevel, 
    location, 
    savedSearches, 
    onSave, 
    className 
}) {
    // Check if current search parameters match any saved search
    const isAlreadySaved = savedSearches.some(search => {
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
            <Bookmark className="h-4 w-4 mr-2" />
            Save Search
        </Button>
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
    const [savedSearches, setSavedSearches] = useState([]);
    const [currentController, setCurrentController] = useState(null);
    const [titleSynonyms, setTitleSynonyms] = useState([]);

    // Add a computed variable for filter text
    const filterText = [
        title && `Title: ${title}`,
        experienceLevel && `Experience: ${experienceLevel}`,
        location && `Location: ${location}`,
        company && `Company: ${companies.find(c => c.id === company)?.name || company}`,
    ].filter(Boolean).join(', ');

    // Helper function to cancel pending requests
    const cancelPendingRequests = () => {
        if (currentController) {
            currentController.abort();
        }
    };

    // Modified fetch function with cancellation
    const fetchWithCancel = async (url, options = {}) => {
        cancelPendingRequests();
        const controller = new AbortController();
        setCurrentController(controller);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            const data = await response.json();
            return data;
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

    useEffect(() => {
        if (!loading) { 
            const cacheKeyTotal = `totalJobs_${title}_${experienceLevel}_${location}_${company}`;
            const cacheKey = `jobPostings_${currentPage}_${title}_${experienceLevel}_${location}_${company}`;
            const cachedTotal = sessionStorage.getItem(cacheKeyTotal);
            const cachedData = sessionStorage.getItem(cacheKey);
            const cacheExpiry = 3600 * 1000; // 1 hour in milliseconds
            const now = Date.now();
    
            const isCacheValid = (key) => {
                const cacheTimestamp = sessionStorage.getItem(`${key}_timestamp`);
                return cacheTimestamp && now - parseInt(cacheTimestamp, 10) < cacheExpiry;
            };

            async function fetchData() {
                try {
                    const result = await fetchWithCancel(`/api/job-postings?page=${currentPage}&limit=${limit}&title=${title}&experienceLevel=${experienceLevel}&location=${location}&company=${company}`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });
                    if (result) {
                        setData(result.jobPostings);
                        sessionStorage.setItem(cacheKey, JSON.stringify(result.jobPostings));
                        sessionStorage.setItem(`${cacheKey}_timestamp`, now);
                    }
                } catch (error) {
                    console.error("Error fetching job postings:", error);
                }
            }

            async function fetchTotalJobs() {
                try {
                    const result = await fetchWithCancel(`/api/job-postings/count?title=${encodeURIComponent(title)}&experienceLevel=${encodeURIComponent(experienceLevel)}&location=${encodeURIComponent(location)}&company=${encodeURIComponent(company)}`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                        },
                    });
                    if (result) {
                        setTotalJobs(result.totalJobs);
                        sessionStorage.setItem(cacheKeyTotal, result.totalJobs);
                        sessionStorage.setItem(`${cacheKeyTotal}_timestamp`, now);
                    }
                } catch (error) {
                    console.error("Error fetching total jobs:", error);
                }
            }

            const resetCache = () => {
                sessionStorage.removeItem(cacheKeyTotal);
                sessionStorage.removeItem(`${cacheKeyTotal}_timestamp`);
                sessionStorage.removeItem(cacheKey);
                sessionStorage.removeItem(`${cacheKey}_timestamp`);
            };
    
            if (isCacheValid(cacheKeyTotal)) {
                try {
                    setTotalJobs(parseInt(cachedTotal, 10));
                } catch (error) {
                    resetCache();
                    fetchTotalJobs();
                    console.error("Error parsing cached total jobs:", error);
                }
            } else {
                fetchTotalJobs();
            }
    
            if (isCacheValid(cacheKey)) {
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

        // Cleanup function to cancel pending requests when component unmounts or dependencies change
        return () => {
            cancelPendingRequests();
        };
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
      if (title) {
        fetch(`/api/job-postings/synonyms?title=${encodeURIComponent(title)}`)
          .then(res => res.json())
          .then(data => setTitleSynonyms(data.synonyms))
          .catch(error => console.error('Error fetching synonyms:', error));
      } else {
        setTitleSynonyms([]);
      }
    }, [title]);

    const handleResetFilters = () => {
        setTitle("");
        setExperienceLevel("");
        setLocation("");
        setCompany("");
        setCurrentPage(1);
        router.push('/job-postings');
    };

    const handleNextPage = () => {
        setCurrentPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    const handleSearch = async (searchValue) => {
        setTitle(searchValue);
        setCurrentPage(1);
    };

    const handleExperienceLevelChange = async (value) => {
        cancelPendingRequests();
        setExperienceLevel(value);
        setCurrentPage(1);

    };

    const handleLocationChange = async (value) => {
        cancelPendingRequests();
        setLocation(value);
        setCurrentPage(1);

    };

    const handleCompanyChange = (value) => {
        setCompany(value);
    };

    const handleCompanySearch = (e) => {
        setCompanySearch(e.target.value);
    };

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

    const applySavedSearch = (searchParams) => {
        const params = JSON.parse(searchParams);
        setTitle(params.jobTitle || '');
        setExperienceLevel(params.experienceLevel || '');
        setLocation(params.location || '');
        setCurrentPage(1);
    };

    const handleSaveSearch = async () => {
        if (!user) return;

        const searchParams = {
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
                body: JSON.stringify({ searchParams }),
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
                {totalJobs.toLocaleString()} Job Postings
            </h1>

            {/* Active Filters */}
            {(title || experienceLevel || location || company) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {title && (
                        <Badge variant="secondary" className="text-sm pr-1 flex items-center gap-1">
                            Title: {title}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0 hover:bg-accent"
                                onClick={() => setTitle("")}
                            >
                                <X size={12} strokeWidth={2} />
                            </Button>
                        </Badge>
                    )}
                    {experienceLevel && (
                        <Badge variant="secondary" className="text-sm pr-1 flex items-center gap-1">
                            Experience: {experienceLevel}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0 hover:bg-accent"
                                onClick={() => setExperienceLevel("")}
                            >
                                <X size={12} strokeWidth={2} />
                            </Button>
                        </Badge>
                    )}
                    {location && (
                        <Badge variant="secondary" className="text-sm pr-1 flex items-center gap-1">
                            Location: {location}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0 hover:bg-accent"
                                onClick={() => setLocation("")}
                            >
                                <X size={12} strokeWidth={2} />
                            </Button>
                        </Badge>
                    )}
                    {company && (
                        <Badge variant="secondary" className="text-sm pr-1 flex items-center gap-1">
                            Company: {companies.find(c => c.id === company)?.name || company}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0 hover:bg-accent"
                                onClick={() => setCompany("")}
                            >
                                <X size={12} strokeWidth={2} />
                            </Button>
                        </Badge>
                    )}
                </div>
            )}

            <div className="max-w-md mx-auto">

            </div>

            {user && (
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

            <MemoizedInput26 onSearch={handleSearch} value={title} />
            <SearchSynonymsInfo title={title} synonyms={titleSynonyms} />
            <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-2">
            {user && (
                    <SaveSearchButton
                        title={title}
                        experienceLevel={experienceLevel}
                        location={location}
                        savedSearches={savedSearches}
                        onSave={handleSaveSearch}
                        className="whitespace-nowrap"
                    />
                )}
            <ExperienceLevelSelect onChange={handleExperienceLevelChange} value={experienceLevel} />
                <LocationSelect onChange={handleLocationChange} value={location} />
                <Button 
                    variant="outline"  
                    size="sm"
                    onClick={handleResetFilters}
                    className="whitespace-nowrap"
                >
                    Reset Filters
                </Button>
                {!loading && user && <LLMChat user={user} />}
            </div>
            </ScrollArea>

            {savedSearches.length > 0 && (
                <div className="mt-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-semibold">Saved Searches</h2>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push('/job-postings/saved-searches')}
                            className="h-8 w-8 p-0"
                        >
                            <Plus  size={16} strokeWidth={1.5} />
                        </Button>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
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
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}

            <div className="mt-4">
            {data && data.length > 0 ? (
                <div>
                    {data.map((job) => (
                        <>
               <div key={job.id} 
                    className="rounded-md mb-4 border px-4 py-3 font-mono text-sm cursor-pointer hover:bg-accent transition duration-200 ease-in-out" 
                    onClick={() => router.push(`/job-postings/${job.id}`)}
                >
                    {/* Header Section */}
                    <div className="flex items-center gap-4 mb-3">
                        {job.logo && (
                            <Avatar>
                            <AvatarImage src={job.logo} />
                            <AvatarFallback>{job.company?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold text-base">{job?.title || "No job titles available"}</span>
                            <span className="text-sm text-muted-foreground">{job?.company || "No company name available"}</span>
                        </div>
                    </div>
                    {/* Details Section */}
                    <div className="flex flex-row flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-foreground" />
                            <span>{job?.location || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-foreground" />
                            <span>{job?.experienceLevel || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-foreground" />
                            <span>
    {job?.postedDate 
        ? `${formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}` 
        : "N/A"}
</span>

                        </div>
                        {(job?.salary && Number(job.salary) > 0) || job?.salary_range_str ? (
        <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-foreground" />
            <span>
                {Number(job.salary) > 0 
                    ? Number(job.salary).toLocaleString() 
                    : job.salary_range_str}
            </span>
        </div>
    ) : null}
                    </div>
                </div>
                        </>
                    ))}
                </div>
            ) : (
                <p>No job postings found. Adjust your search criteria.</p>
            )}
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