"use client";
import React, { memo, useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { JobList } from "@/components/JobPostings";
import EditProfileDialog from '@/components/edit-profile'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobPostingsChart } from "@/components/job-postings-chart";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

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
import { ArrowRight, Search, Info, ChevronLeft, SparkleIcon, Filter, Clock, Zap, X, Factory, Scroll, FilterX, Loader2, Map, BookmarkIcon, Edit2, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness } from "lucide-react";
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
import { set } from 'date-fns';
import { throttle } from 'lodash';
import { is } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// Add encryption utilities
const encryptData = (data) => {
  try {
    // Simple XOR encryption with a random key
    const key = Math.random().toString(36).substring(2);
    const encrypted = JSON.stringify(data).split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return { encrypted, key };
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

const decryptData = (encrypted, key) => {
  try {
    const decrypted = encrypted.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Add compression utilities at the top with the other utility functions
const compressData = async (data) => {
  try {
    // Check if CompressionStream is available
    if ('CompressionStream' in window) {
      const jsonString = JSON.stringify(data);
      const encodedData = new TextEncoder().encode(jsonString);
      const compressedStream = new Blob([encodedData]).stream().pipeThrough(new CompressionStream('gzip'));
      const compressedData = await new Response(compressedStream).arrayBuffer();
      return new Uint8Array(compressedData);
    } else {
      // Fallback compression using base64 and simple RLE
      const jsonString = JSON.stringify(data);
      let compressed = '';
      let count = 1;

      for (let i = 0; i < jsonString.length; i++) {
        if (jsonString[i] === jsonString[i + 1]) {
          count++;
        } else {
          compressed += (count > 1 ? count : '') + jsonString[i];
          count = 1;
        }
      }

      return btoa(compressed);
    }
  } catch (error) {
    console.error('Compression error:', error);
    return null;
  }
};

const decompressData = async (compressed) => {
  try {
    // Check if CompressionStream is available
    if ('CompressionStream' in window && compressed instanceof Uint8Array) {
      const decompressedStream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      const decompressedData = await new Response(decompressedStream).arrayBuffer();
      const decoded = new TextDecoder().decode(new Uint8Array(decompressedData));
      return JSON.parse(decoded);
    } else {
      // Fallback decompression
      const decompressed = atob(compressed);
      let result = '';
      let i = 0;

      while (i < decompressed.length) {
        let count = '';
        while (/\d/.test(decompressed[i])) {
          count += decompressed[i++];
        }
        result += decompressed[i].repeat(count ? parseInt(count) : 1);
        i++;
      }

      return JSON.parse(result);
    }
  } catch (error) {
    console.error('Decompression error:', error);
    return null;
  }
};

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


const CompanyInfo = memo(function CompanyInfo({ company, resetCompanyData, companies }) {
  if (!company) return null;
  if (!companies) return null;
  const companyObject = companies.find(c => c.name === company);
  if (!companyObject) return null;

  return (
    <div className="z-[100] max-w-[400px] mb-4 rounded-xl border border-emerald-700/20 bg-emerald-500/20 px-2 py-2">
      <div className="flex items-center gap-2">
        <Avatar className="w-6 h-6">
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

// Add this new component near the top with other component imports
const TrendingJobCards = memo(function TrendingJobCards() {
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTrendingJobs = async () => {
      try {
        const response = await fetch('/api/job-postings/trending', { cache: 'force-cache' });
        const data = await response.json();
        if (data.ok) {
          setTrendingJobs(data.trendingJobs);
        }
      } catch (error) {
        console.error('Error fetching trending jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-w-[250px] p-0 m-0 cursor-pointer hover:border-primary transition-colors animate-pulse">
            <CardHeader>
              <div className="h-5 w-3/4 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
              <div className="h-4 w-1/3 bg-muted rounded mt-1 hidden sm:block"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {trendingJobs.map((job) => (
        <Card 
          key={job.title} 
          className="min-w-[250px] p-0 m-0 cursor-pointer hover:border-muted-foreground transition-colors"
          onClick={() => {
            const params = new URLSearchParams({ title: job.title });
            router.push(`/job-postings?${params.toString()}`);
          }}
        >
          <CardHeader className="p-4 py-2 sm:p-6">
            <CardTitle className="text-base truncate">{job.title}</CardTitle>
            <CardDescription>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-primary">{job.category}</span>
                <span>{parseInt(job.count).toLocaleString()} new jobs in 30 days</span>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
});

export default function JobPostingsPage() {
  const { user, loading: authLoading, updatePreferences: updateUserPreferences } = useAuth();
  const router = useRouter();
  const enabled = false;

  const [data, setData] = useState([]);
  const [title, setTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [saved, setSaved] = useState(false);
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [strictSearch, setStrictSearch] = useState(true);
  const [count, setCount] = useState(0);
  const limit = 30;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastRequestRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Add new state for tracking data freshness
  const [dataTimestamp, setDataTimestamp] = useState(null);

  // Modify the data storage to include timestamp
  const storeDataInSession = (data, page, params) => {
    const timestamp = Date.now();
    const storageData = {
      data,
      page,
      params,
      timestamp
    };

    const { encrypted, key } = encryptData(storageData);
    if (!encrypted || !key) return;

    sessionStorage.setItem('jobListingsState', JSON.stringify({
      data: encrypted,
      key,
      timestamp
    }));
    setDataTimestamp(timestamp);
  };

  // Add this function to check if stored data is still fresh (less than 10 mins old)
  const isDataFresh = (timestamp) => {
    const TEN_MINUTES = 10 * 60 * 1000;
    return Date.now() - timestamp < TEN_MINUTES;
  };

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
              <div>
              <p className="text-sm font-medium">Filter job postings</p>
              <p className="text-muted-foreground text-xs">
                Filter through over {count} job postings!
              </p>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-foreground text-sm">Company</span>
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

              {(title || experienceLevel || location || company || saved) && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => {
                  setCompanyData([]);
                  setCompany("");
                  setTitle("");
                  setExperienceLevel("");
                  setSaved(false);
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

  function TabComponent({ savedSearches, applySavedSearch, currentSearchParams, editComponent }) {
    const [activeTab, setActiveTab] = useState('all');
    const router = useRouter();

    // Memoize the tab click handler
    const handleTabClick = useCallback((searchId, criteria = null) => {
      if (searchId === 'saved') {
        // Handle saved jobs tab
        setActiveTab('saved');
        router.push('/job-postings?saved=true');
        return;
      }

      if (searchId === 'preferences') {
        // Handle preferences tab
        setActiveTab('preferences');
        const params = new URLSearchParams({
          title: user.jobPrefsTitle,
          location: user.jobPrefsLocation,
          explevel: user.jobPrefsLevel
        });
        router.push(`/job-postings?${params.toString()}`);
        return;
      }

      if (searchId === 'all') {
        // Handle all jobs tab
        setActiveTab('all');
        router.push('/job-postings');
        return;
      }

      // Handle saved search tab
      if (criteria) {
        setActiveTab(searchId);
        const params = new URLSearchParams({
          ...(criteria.title && { title: criteria.title }),
          ...(criteria.experienceLevel && { explevel: criteria.experienceLevel }),
          ...(criteria.location && { location: criteria.location })
        });
        router.push(`/job-postings?${params.toString()}`);
      }
    }, [router]);

    // Update active tab based on URL params
    useEffect(() => {
      if (currentSearchParams.saved) {
        setActiveTab('saved');
      } else if (!currentSearchParams.title && !currentSearchParams.explevel && !currentSearchParams.location) {
        setActiveTab('all');
      } else if (currentSearchParams.location === 'remote') {
        setActiveTab('remote');
      } else if (user && (user.jobPrefsTitle && user.jobPrefsTitle.includes(currentSearchParams.title) && user.jobPrefsLocation && user.jobPrefsLocation.includes(currentSearchParams.location) && user.jobPrefsLevel && user.jobPrefsLevel.includes(currentSearchParams.explevel))) {
        setActiveTab('preferences');
      }
      else {
        const matchingSavedSearch = savedSearches?.find(search => {
          const criteria = search.search_criteria;
          return (
            criteria.title === currentSearchParams.title &&
            criteria.experienceLevel === currentSearchParams.explevel &&
            criteria.location === currentSearchParams.location
          );
        });
        if (matchingSavedSearch) {
          setActiveTab(matchingSavedSearch.id);
        }
      }
    }, [currentSearchParams, savedSearches]);

    return (
      <Tabs value={activeTab}>
        <TabsList className="bg-transparent p-0 mb-0">
          {editComponent}
          <TabsTrigger
            value="all"
            onClick={() => handleTabClick('all')}
            className="h-8 data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            All
          </TabsTrigger>

          {!authLoading && user && (
            <>
              <TabsTrigger
                value="preferences"
                onClick={() => handleTabClick('preferences')}
                className="h-8 data-[state=active]:bg-muted data-[state=active]:shadow-none"
              >
                <SparkleIcon size={16} strokeWidth={2} className="shrink-0" />
              </TabsTrigger>
            </>
          )}


          <TabsTrigger
            value="remote"
            onClick={() => handleTabClick('remote', { location: 'remote' })}
            className="h-8 data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Remote
          </TabsTrigger>

          {savedSearches?.map((search) => (
            <TabsTrigger
              key={search.id}
              value={search.id}
              onClick={() => handleTabClick(search.id, search.search_criteria)}
              className="h-8 data-[state=active]:bg-muted data-[state=active]:shadow-none"
            >
              {search.search_name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }

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

  const fetchBookmarkedJobs = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      const response = await fetch('/api/dashboard/bookmarked-jobs', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        cache: 'force-cache',
      });

      if (!response.ok) throw new Error('Failed to fetch bookmarked jobs');
      const bookmarkedJobs = await response.json();
      setData(bookmarkedJobs);
      setCount(bookmarkedJobs.length);
    } catch (err) {
      console.error('Error fetching bookmarked jobs:', err);
    } finally {
      setDataLoading(false);
      setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!dataLoading && user) {
      fetch('/api/saved-searches', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        cache: 'force-cache',
      })
        .then(response => response.json())
        .then(data => setSavedSearches(data.savedSearches))
        .catch(error => console.error('Error fetching saved searches:', error));
    }
  }, [user, authLoading, dataLoading]);

  const profileFields = [
    {
      type: 'multiselect',
      name: 'job_prefs_title',
      label: 'Desired Job Titles',
      placeholder: 'preferred job title',
      options: [
        { value: 'Software Engineer', label: 'Software Engineer' },
        { value: 'Frontend Developer', label: 'Frontend Developer' },
        { value: 'Backend Developer', label: 'Backend Developer' },
        { value: 'Full Stack Developer', label: 'Full Stack Developer' },
        { value: 'DevOps Engineer', label: 'DevOps Engineer' },
        { value: 'Project Manager', label: 'Project Manager' },
        // Add more options as needed
      ]
    },
    {
      type: 'multiselect',
      name: 'job_prefs_location',
      label: 'Preferred Locations',
      placeholder: 'preferred location',
      options: [
        { value: 'New York', label: 'New York' },
        { value: 'San Francisco', label: 'San Francisco' },
        { value: 'Remote', label: 'Remote' },
        // Add more location options as needed
      ]
    },
    /*
    {
      type: 'text',
      name: 'job_prefs_industry',
      label: 'test',
      placeholder: 'e.g. Technology, Finance'
    },
    {
      type: 'text',
      name: 'job_prefs_language',
      label: 'test',
      placeholder: 'e.g. English'
    },
    */
    {
      type: 'multiselect',
      name: 'job_prefs_level',
      label: 'Experience Level',
      options: [
        { value: 'Internship', label: 'Internship' },
        { value: 'Entry Level', label: 'Entry Level' },
        { value: 'Mid Level', label: 'Mid Level' },
        { value: 'Senior Level', label: 'Senior Level' },
        { value: 'Lead', label: 'Lead' },
        { value: 'Manager', label: 'Manager' }
      ]
    },
    {
      type: 'number',
      name: 'job_prefs_salary',
      label: 'Expected Salary (Annual)',
      placeholder: 'Enter expected salary'
    },
    {
      type: 'boolean',
      name: 'job_prefs_relocatable',
      label: 'Willing to Relocate'
    }
  ];

  const handleProfileUpdate = async (formData) => {
    try {
      // Ensure all array fields are properly formatted
      const processedData = {
        ...formData,
        job_prefs_title: formData.job_prefs_title
          ? (Array.isArray(formData.job_prefs_title)
            ? formData.job_prefs_title
            : [formData.job_prefs_title])
          : [],
        job_prefs_location: formData.job_prefs_location
          ? (Array.isArray(formData.job_prefs_location)
            ? formData.job_prefs_location
            : [formData.job_prefs_location])
          : [],
        job_prefs_level: formData.job_prefs_level
          ? (Array.isArray(formData.job_prefs_level)
            ? formData.job_prefs_level
            : [formData.job_prefs_level])
          : [],
        job_prefs_salary: formData.job_prefs_salary
          ? parseInt(formData.job_prefs_salary, 10)
          : null,
        job_prefs_relocatable: Boolean(formData.job_prefs_relocatable)
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const { user: updatedUser } = await response.json();

      // Update the auth context with new preferences
      if (updateUserPreferences) {
        await updateUserPreferences({
          job_prefs_title: updatedUser.job_prefs_title,
          job_prefs_location: updatedUser.job_prefs_location,
          job_prefs_level: updatedUser.job_prefs_level
        });
      }

      router.refresh();
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  const applySavedSearch = (searchParamsStr) => {
    const params = JSON.parse(searchParamsStr);
    const newTitle = params.jobTitle || params.title || '';
    const newExp = params.explevel || params.experienceLevel || '';
    const newLoc = params.location || '';
    const saved = params.saved || false;

    if (saved) {
      const newUrl = `/job-postings?saved=true`;
      if (newUrl !== router.asPath) {
        router.push(newUrl);
      }
      return;
    }
    setTitle(newTitle);
    setExperienceLevel(newExp);
    setLocation(newLoc);
    setCurrentPage(1);

    const newParams = {
      ...(newTitle && { title: newTitle }),
      ...(newExp && { explevel: newExp }),
      ...(newLoc && { location: newLoc }),
      page: '1',
      saved: false,
    };
    const qs = new URLSearchParams(newParams).toString();
    const newUrl = `/job-postings?${qs}`;
    if (newUrl !== router.asPath) {
      router.push(newUrl);
    }
  };

  const handleTitleSearch = useCallback(
    (val) => {
      if (val !== title) {
        setTitle(val);
        setCurrentPage(1);
        const params = {
          ...Object.fromEntries(new URLSearchParams(window.location.search)),
          title: val,
          page: '1'
        };
        // Remove empty params
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        const newParams = new URLSearchParams(params);
        const newUrl = `/job-postings?${newParams.toString()}`;
        if (newUrl !== router.asPath) {
          router.push(newUrl);
        }
      }
    },
    [router, title]
  );

  const handleLocationSearch = useCallback(
    (val) => {
      if (val !== location) {
        setLocation(val);
        setCurrentPage(1);
        const params = {
          ...Object.fromEntries(new URLSearchParams(window.location.search)),
          location: val,
          page: '1'
        };
        // Remove empty params
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        const newParams = new URLSearchParams(params);
        const newUrl = `/job-postings?${newParams.toString()}`;
        if (newUrl !== router.asPath) {
          router.push(newUrl);
        }
      }
    },
    [router, location]
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
            className="peer pr-24 z-1 ps-9 h-11 rounded-xl text-[16px]"
            placeholder={"Search for a job title"}
            onKeyDown={handleKeyDown}
            type="search"
            value={searchValue}
            onChange={handleInputChange}
          />
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

  function LocationSearch({ location, setLocation }) {
    const [searchValue, setSearchValue] = useState(location || "");
    const [timer, setTimer] = useState(null);


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
            className="peer pr-24 z-1 ps-9 h-11 rounded-xl text-[16px]"
            placeholder={"Search for a location"}
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

  const activeFilters = [
    { label: 'Title', value: title },
    { label: 'Experience', value: experienceLevel },
    { label: 'Location', value: location },
    { label: 'Company', value: company },
  ].filter(filter => filter.value);

  // Construct the header title
  const headerTitle = activeFilters.length
    ? `Search Results${activeFilters.length > 1 ? '' : ''}`
    : 'Job Postings';


  const handleScroll = useCallback(() => {
    if (!hasMore || dataLoading || isLoading) return;

    const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
    const scrollThreshold = document.documentElement.offsetHeight - 800;

    if (scrollPosition > scrollThreshold) {
      setIsLoading(true); // Set loading state before incrementing page
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, dataLoading, isLoading]);

  useEffect(() => {
    const throttledScrollHandler = throttle(handleScroll, 200); // Reduce throttle time
    window.addEventListener('scroll', throttledScrollHandler);

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      throttledScrollHandler.cancel();
    };
  }, [handleScroll]);
  useRef(true);
  useEffect(() => {
    const controller = new AbortController();
    lastRequestRef.current = controller;

    async function storeResponseInLocalStorage(route_location, route_response) {
      try {
        // Purge old data from localStorage
        Object.keys(localStorage).forEach(key => {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item.timestamp && Date.now() - item.timestamp > 60 * 60 * 1000) { // 1 hour
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Skip non-JSON items
          }
        });

        const compressed = await compressData(route_response);
        if (!compressed) return;

        const { encrypted, key } = encryptData(compressed);
        if (!encrypted || !key) return;

        localStorage.setItem(route_location, JSON.stringify({
          data: encrypted,
          key,
          compressed: true,
          timestamp: Date.now()
        }));
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          // console.error("LocalStorage quota exceeded. Consider clearing some space or optimizing data size.");
        } else {
          console.error("Error storing encrypted response in local storage:", error);
        }
      }
    }

    async function isDataInLocalStorage(route_location) {
      try {
        const storedData = localStorage.getItem(route_location);
        if (!storedData) return null;

        const { data: encrypted, key, compressed, timestamp } = JSON.parse(storedData);
        if (!encrypted || !key) return null;

        // Check if data is older than 1 hour
        if (Date.now() - timestamp > 60 * 60 * 1000) {
          localStorage.removeItem(route_location);
          return null;
        }

        const decrypted = decryptData(encrypted, key);
        if (!decrypted) return null;

        return compressed ? await decompressData(decrypted) : decrypted;
      } catch (error) {
        console.error("Error checking encrypted local storage:", error);
        return null;
      }
    }

    async function fetchData() {
      if (currentPage === 1) {
        setData([]);
        setInitialLoading(true);
      }
      setDataLoading(true);

      try {
        if (saved) {
          await fetchBookmarkedJobs();
          return;
        }

        const params = buildQueryParams();
        const route = `/api/job-postings?${params.toString()}`;
        const cachedData = await isDataInLocalStorage(route);

        if (isCacheValid(cachedData)) {
          // Check for cached data from multiple pages
          const cachedPages = [];
          let pageNum = 1;

          while (true) {
            const pageParams = new URLSearchParams(params);
            pageParams.set('page', pageNum.toString());
            const pageRoute = `/api/job-postings?${pageParams.toString()}`;
            const pageData = await isDataInLocalStorage(pageRoute);

            if (!pageData || !isCacheValid(pageData)) {
              break;
            }

            cachedPages.push(...pageData.jobPostings);
            if (!pageData.hasMore) break;
            pageNum++;
          }

          setData(cachedPages);
          setHasMore(cachedPages.length >= pageNum * limit);
          setCurrentPage(pageNum);
        } else {
          const jobData = await fetchJobData(route);
          await storeResponseInLocalStorage(route, jobData);
          updateJobDataState(jobData);
        }

        if (currentPage === 1) {
          fetchAdditionalData(params);
        }

        setDataLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Error:", err);
      } finally {
        setInitialLoading(false);
        setIsLoading(false);
      }
    }

    function buildQueryParams() {
      const params = new URLSearchParams();
      
      // Handle title preferences
      if (title) {
        params.append('title', title);
      } else if (user?.jobPrefsTitle?.length) {
        // Add all preferred titles as separate parameters
        user.jobPrefsTitle.forEach(t => params.append('title', t));
      }

      // Handle experience level
      if (experienceLevel) {
        params.append('experienceLevel', experienceLevel);
      } else if (user?.jobPrefsLevel?.length) {
        // Add all preferred levels as separate parameters
        user.jobPrefsLevel.forEach(l => params.append('experienceLevel', l));
      }

      // Handle location preferences
      if (location) {
        params.append('location', location.toLowerCase());
      } else if (user?.jobPrefsLocation?.length) {
        // Add all preferred locations as separate parameters
        user.jobPrefsLocation.forEach(l => params.append('location', l.toLowerCase()));
      }

      // Add remaining parameters
      if (company) params.append('company', company);
      params.append('strictSearch', strictSearch.toString());
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      return params;
    }

    function isCacheValid(cachedData) {
      return cachedData && Date.now() - cachedData.timestamp < 15 * 60 * 1000;
    }

    async function fetchJobData(route) {
      const response = await fetch(route, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'cache-control': 'force-cache'
        },
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      data.timestamp = Date.now();
      data.hasMore = data.jobPostings.length === limit;
      return data;
    }

    function updateJobDataState(jobData) {
      const newJobs = jobData?.jobPostings || [];
      setHasMore(newJobs.length === limit);
      setData(prevData => {
        if (currentPage === 1) {
          return newJobs;
        }
        const existingIds = new Set(prevData.map(job => job.id));
        const uniqueNewJobs = newJobs.filter(job => !existingIds.has(job.id));
        return [...prevData, ...uniqueNewJobs];
      });
    }

    function fetchAdditionalData(params) {
      Promise.all([
        fetch(`/api/job-postings/count?${params.toString()}`, { cache: 'force-cache' }),
        fetch(`/api/companies`, { cache: 'force-cache' })
      ])
        .then(([countRes, compRes]) => Promise.all([countRes.json(), compRes.json()]))
        .then(([countData, companiesData]) => {
          console.log(countData);
          setCount(countData?.count || countData.totalJobs || 0);
          setCompanies(companiesData || []);
        })
        .catch(console.error);
    }
    fetchData();

    return () => {
      controller.abort();
    };
  }, [
    user,
    authLoading,
    currentPage,
    title,
    experienceLevel,
    location,
    company,
    strictSearch,
    saved,
    fetchBookmarkedJobs
  ]);

  // Clear stored data when search parameters change
  useEffect(() => {
    if (currentPage === 1) {
      sessionStorage.removeItem('jobListingsState');
      setDataTimestamp(null);
    }
  }, [title, experienceLevel, location, company, saved, currentPage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('jobListingsScrollPos', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Also save on page hide (mobile browsers)
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);



  return (
    <>
      <div className="container mx-auto py-0 p-6 max-w-4xl">
        <Suspense fallback={<div>Loading search parameters...</div>}>
          <SearchParamsHandler
            setTitle={setTitle}
            setExperienceLevel={setExperienceLevel}
            setLocation={setLocation}
            setCompany={setCompany}
            setSaved={setSaved}
            setCurrentPage={setCurrentPage}
          />
        </Suspense>
        <div className="z-0">
          <div className="flex pt-6 pb-6 items-center gap-2">
            <TrendingJobCards />
          </div>     


          {company && (
            <Suspense>
              <CompanyInfo company={company} resetCompanyData={resetCompanyData} companies={companies} />
            </Suspense>
          )}
          <Suspense fallback={<div>Loading...</div>}>
            <MemoizedInput26 onSearch={handleTitleSearch} value={title} count={count} userPreferredTitle={user?.jobPrefsTitle} />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <MemoizedLocationSearch location={location} setLocation={handleLocationSearch} userPreferredLocation={user?.jobPrefsLocation} />
          </Suspense>

          <div className="flex flex-row items-center flex-wrap sm:flex-nowrap gap-2">
            <TabComponent
              savedSearches={savedSearches}
              applySavedSearch={applySavedSearch}
              currentSearchParams={{ title, explevel: experienceLevel, location, saved }}
              editComponent={!authLoading && user && (
                <EditProfileDialog
                  fields={profileFields}
                  initialData={{
                    job_prefs_title: user?.jobPrefsTitle || [],
                    job_prefs_location: user?.jobPrefsLocation || [],
                    job_prefs_level: user?.jobPrefsLevel || [],
                    job_prefs_salary: user?.jobPrefsSalary || null,
                    job_prefs_relocatable: user?.jobPrefsRelocatable || false
                  }}
                  onSubmit={handleProfileUpdate}
                  title={<Settings size={12} />}
                />
              )}
            />
          <Suspense fallback={<div>Loading...</div>}>

              <h1 className="text-xs ml-auto font-[family-name:var(--font-geist-sans)] text-muted-foreground font-medium mb-0">
                <span className="text-green-500 dark:text-green-200 font-semibold">
                  {count ? count.toLocaleString() : 0}
                </span>  {headerTitle}
              </h1>
          </Suspense>
          </div>
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



          <div>
            <JobList data={data} loading={dataLoading} error={null} />
          </div>
        </Suspense>
      </div>
    </>
  );
}