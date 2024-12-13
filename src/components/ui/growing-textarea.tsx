"use client";

import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent, useRef, useState, useEffect } from "react";
import { Loader2, CheckCircle, LoaderCircle, Send, CircleCheck } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

type Status = "idle" | "loading" | "done";

interface JobContent {
  title?: string;
  company?: string;
  location?: string;
  error?: string;
}

export default function ExpandingTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const defaultRows = 1;
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [systemMessage, setSystemMessage] = useState<string>("You are a career assistant. Please provide career advice.");
  const [inputValue, setInputValue] = useState("");
  const [llmParsedCriteria, setLlmParsedCriteria] = useState<null | {
    title: string;
    company: string;
    experienceLevel: string;
    location: string;
  }>(null);

  const [localJobs, setLocalJobs] = useState<any[]>([]);
  const [timings, setTimings] = useState<Record<string, any>>({});
  const [externalJobs, setExternalJobs] = useState<Array<{ text: string; url: string; jobContent?: JobContent }>>([]);
  const [isLoading, setLoading] = useState(false);

  // Step statuses
  const [creatingSqlStatus, setCreatingSqlStatus] = useState<Status>("idle");
  const [fetchingLocalStatus, setFetchingLocalStatus] = useState<Status>("idle");
  const [fetchingExternalStatus, setFetchingExternalStatus] = useState<Status>("idle");
  const [processingExternalJobsStatus, setProcessingExternalJobsStatus] = useState<Status>("idle");

  // External job processing states
  const [currentExternalJobIndex, setCurrentExternalJobIndex] = useState(0);
  const [processingExternalJob, setProcessingExternalJob] = useState(false);

  // Pagination for external jobs
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true); // Track if we have more pages to load

  const saveToLocalStorage = (key: string, value: string) => {
    const existingValues = getFromLocalStorage(key);
    if (!existingValues.includes(value)) {
      existingValues.push(value);
      localStorage.setItem(key, JSON.stringify(existingValues));
    }
  };

  const getFromLocalStorage = (key: string): string[] => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : [];
  };

  const recentSearches = getFromLocalStorage("recent-job-search-list");
  const maxRows = undefined; // Optional max rows setting

  useEffect(() => {
    const loadProfile = async (user: any) => {
      try {
        // First fetch basic profile data
        console.info("Fetching user profile...");
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        setProfile(data);
        if (data) constructSystemMessage(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const constructSystemMessage = (userProfile: any) => {
      console.info("Constructing system message...");
      const technicalSkills = userProfile.user.technical_skills || 'No technical skills available.';
      const softSkills = userProfile.user.soft_skills || 'No soft skills available.';
      const systemMessage = {
        role: "system",
        content: `
Please provide me personalized resume help for the following queries based on my resume below:

### Professional Summary
${userProfile.user.professionalSummary || 'No summary available.'}

### Work Experience
${userProfile.experience && userProfile.experience.length > 0 
? userProfile.experience.map((exp: any) => 
    `- **${exp.title}** at **${exp.companyName}** (${new Date(exp.startDate).toLocaleDateString()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()})
- **Location**: ${exp.location || 'Not specified'}
- **Description**: ${exp.description || 'No description available'}
- **Tags**: ${exp.tags || 'No tags available'}`).join('\n\n')
: 'No work experience available.'}

### Education
${userProfile.education && userProfile.education.length > 0
? userProfile.education.map((edu: any) => 
    `- **${edu.degree} in ${edu.fieldOfStudy}** from **${edu.institutionName}**
- **Duration**: ${new Date(edu.startDate).toLocaleDateString()} - ${edu.isCurrent ? 'Present' : new Date(edu.endDate).toLocaleDateString()}
- **Grade**: ${edu.grade || 'Not specified'}
- **Activities**: ${edu.activities || 'No activities specified'}`).join('\n\n')
: 'No education details available.'}

### Skills
- **Technical Skills**: ${technicalSkills}
- **Soft Skills**: ${softSkills}

Below are job preferences to guide your decisions for the kind of jobs.

### Job Preferences
- MY PREFERRED JOB TITLE: ${userProfile.user.desired_job_title || 'Not specified'}
- **Preferred Location**: ${userProfile.user.desired_location || 'Any location'}
- MY MINIMUM SALARY: $${userProfile.user.jobPreferredSalary || '25,000 per year'}
- MY HIGHEST EXPERIENCE LEVEL: ${userProfile.user.employment_type || 'Not specified'}
- MY PREFERRED INDUSTRIES: ${userProfile.user.preferred_industries || 'Not specified'}
- I AM ${userProfile.user.willing_to_relocate ? 'OPEN' : 'NOT OPEN'} TO RELOCATE FOR A JOB ONLY RECOMMEND JOBS IN ${userProfile.user.desired_location || 'ANYWHERE'}

            `,
      };
      setSystemMessage(systemMessage.content);
    }

    if (!loading && user) {
      loadProfile(user);
    }
  }, [user, loading]);

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputValue(textarea.value);

    // Auto-growing logic
    textarea.style.height = "auto";
    const style = window.getComputedStyle(textarea);
    const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
    const paddingHeight = parseInt(style.paddingTop) + parseInt(style.paddingBottom);
    const lineHeight = parseInt(style.lineHeight);
    const maxHeight = maxRows ? lineHeight * maxRows + borderHeight + paddingHeight : Infinity;
    const newHeight = Math.min(textarea.scrollHeight + borderHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setCreatingSqlStatus("loading");
    setFetchingLocalStatus("idle");
    setFetchingExternalStatus("idle");
    setProcessingExternalJobsStatus("idle");
    setLlmParsedCriteria(null);
    setLocalJobs([]);
    setExternalJobs([]);
    setTimings({});
    setCurrentExternalJobIndex(0);
    setPage(1);
    setHasMore(true);

    try {
      // 1. Parse the user's input to determine job criteria.
      saveToLocalStorage("recent-job-search-list", inputValue);
      const parsePayload = {
        model: "your-llm-model",
        messages: [
          {
            role: "user",
            content: systemMessage
          },
          {
            role: "user",
            content: inputValue
          }
        ],
        temperature: 0.4,
        max_tokens: 100,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "job_criteria",
            strict: "true",
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  enum: [
                    "Software Engineer",
                    "Data Scientist",
                    "Product Manager",
                    "UX Designer",
                    "DevOps Engineer",
                    "QA Tester",
                    "Business Analyst",
                    "HR Manager",
                    "Marketing Specialist",
                    "Sales Representative",
                    "Systems Administrator",
                    "Technical Support Engineer",
                    "Full Stack Developer",
                    "Frontend Developer",
                    "Backend Developer",
                    "Mobile Developer",
                    "Machine Learning Engineer",
                    "AI Specialist",
                    "Database Administrator",
                    "Network Engineer",
                    "Security Analyst",
                    "Cloud Architect",
                    "IT Project Manager",
                    "Graphic Designer",
                    "Content Writer",
                    "Digital Marketing Manager",
                    "Customer Success Manager",
                    "Operations Manager",
                    "Financial Analyst",
                    "Research Scientist",
                    "Biomedical Engineer",
                  ],
                },
                experienceLevel: { type: "string", enum: ["", "Internship", "Entry", "Junior", "Senior", "Lead"] },
                location: {
                  type: "string",
                  enum: [
                    "Alabama",
                    "Alaska",
                    "Arizona",
                    "Arkansas",
                    "California",
                    "Colorado",
                    "Connecticut",
                    "Delaware",
                    "Florida",
                    "Georgia",
                    "Hawaii",
                    "Idaho",
                    "Illinois",
                    "Indiana",
                    "Iowa",
                    "Kansas",
                    "Kentucky",
                    "Louisiana",
                    "Maine",
                    "Maryland",
                    "Massachusetts",
                    "Michigan",
                    "Minnesota",
                    "Mississippi",
                    "Missouri",
                    "Montana",
                    "Nebraska",
                    "Nevada",
                    "New Hampshire",
                    "New Jersey",
                    "New Mexico",
                    "New York",
                    "North Carolina",
                    "North Dakota",
                    "Ohio",
                    "Oklahoma",
                    "Oregon",
                    "Pennsylvania",
                    "Rhode Island",
                    "South Carolina",
                    "South Dakota",
                    "Tennessee",
                    "Texas",
                    "Utah",
                    "Vermont",
                    "Virginia",
                    "Washington",
                    "West Virginia",
                    "Wisconsin",
                    "Wyoming",
                    "District of Columbia",
                    "Puerto Rico",
                    "Guam",
                    "American Samoa",
                    "U.S. Virgin Islands",
                    "Northern Mariana Islands",
                    "Other",
                  ],
                },
              },
              required: ["title", "location", "experienceLevel"]
            }
          }
        }
      };

      const parseResponse = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsePayload)
      });
      if (!parseResponse.ok) {
        throw new Error("Failed to parse job criteria with LLM");
      }
      const parseData = await parseResponse.json();
      const parsedContent = JSON.parse(parseData.choices[0].message.content);
      const company = "";
      const { title, experienceLevel = "", location } = parsedContent;

      setLlmParsedCriteria({ title, experienceLevel, location, company });
      setCreatingSqlStatus("done");

      // 2. Fetch from local server
      setFetchingLocalStatus("loading");
      const query = new URLSearchParams({
        title: title || "",
        experienceLevel: experienceLevel || "",
        location: location || ""
      }).toString();

      const localUrl = `http://localhost:3000/api/job-postings?${query}`;
      const localJobsData = await fetch(localUrl).then(async (res) => {
        if (!res.ok) {
          return { jobPostings: [], timings: {} };
        }
        return res.json();
      });

      const localFetchedJobs = localJobsData.jobPostings || [];
      const localTimings = localJobsData.timings || {};

      setLocalJobs(localFetchedJobs);
      setTimings(localTimings);
      setFetchingLocalStatus("done");

      // 3. Fetch external results (page 1)
      setFetchingExternalStatus("loading");
      const externalResults = await fetchExternalJobs(title, location, experienceLevel, 1);
      setExternalJobs(externalResults || []);
      setFetchingExternalStatus("done");
    } catch (error) {
      console.error("Error during multi-stage request:", error);
    } finally {
      setFetchingExternalStatus("done");
      setLoading(false);
    }
  };

  async function fetchExternalJobs(title: string, location: string, experienceLevel = "", page = 1) {
    const query = `${title} "${experienceLevel}" jobs in "${location}"`;
    const searchUrl = `http://localhost:4314/search?query=${encodeURIComponent(query)}&page=${page}`;
    const searchResponse = await fetch(searchUrl).catch((err) => {
      console.error("Failed to fetch search results:", err);
    });

    if (!searchResponse || !searchResponse.ok) {
      return [];
    }

    const searchData = await searchResponse.json();
    const linksObj = searchData.links || {};
    const linksArray = Object.entries(linksObj)
      .filter(([_, url]) => typeof url === "string" && !url.includes("google"))
      .map(([text, url]) => ({
        text,
        url
      }));

    // If we got no links, that means no more pages
    if (linksArray.length === 0) {
      setHasMore(false);
    }

    return linksArray;
  }

  async function fetchJobContentWithTimeout(url: string): Promise<JobContent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const contentUrl = `http://localhost:4314/get-job-content?link=${encodeURIComponent(url)}`;
      const response = await fetch(contentUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error("Failed to get job content");
      }
      const data = await response.json();
      return {
        title: data.jobContent.title || data.title,
        company: data.jobContent.company || data.company,
        location: data.jobContent.location || data.location
      };
    } catch (error) {
      console.error(error);
      return { error: "Error fetching job content or timed out." };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Automatically process external jobs and fetch more while processing
  useEffect(() => {
    async function processJobs() {
      // If no external jobs, nothing to process
      if (externalJobs.length === 0) return;

      setProcessingExternalJobsStatus("loading");
      // If we are not currently processing a job and we have a job to process
      if (!processingExternalJob && currentExternalJobIndex < externalJobs.length) {
        setProcessingExternalJob(true);

        const job = externalJobs[currentExternalJobIndex];
        const jobContent = await fetchJobContentWithTimeout(job.url);
        // Update that specific job in the externalJobs state
        setExternalJobs((prev) => {
          const updated = [...prev];
          updated[currentExternalJobIndex] = { ...job, jobContent };
          return updated;
        });
        // Move to the next job
        setCurrentExternalJobIndex((prevIndex) => prevIndex + 1);
        setProcessingExternalJob(false);
      }

      // If we processed all known external jobs but hasMore is true, we can fetch the next page
      // Or: Trigger next page fetch early if we are close to the end of the list
      const threshold = 5; // When we're within 5 jobs from the end, we load more
      if (hasMore && externalJobs.length - currentExternalJobIndex <= threshold && !processingExternalJob) {
        // Fetch next page of results and append them
        await loadNextPageOfExternalJobs();
      }

      // If we have reached the end and no more jobs
      if (currentExternalJobIndex >= externalJobs.length && !hasMore) {
        setProcessingExternalJobsStatus("done");
      }
    }

    processJobs();
  }, [externalJobs, currentExternalJobIndex, processingExternalJob, hasMore, loadNextPageOfExternalJobs]);


  const renderStatus = (label: string, status: Status) => (
    <div className="flex items-center my-2 text-md font-semibold justify-between">
      <span className="mr-2">{label}</span>
      {status === "loading" && <Loader2 className="animate-spin" size={16} />}
      {status === "done" && <CheckCircle className="text-green-600" size={16} />}
    </div>
  );

  const setInputText = (text: string) => {
    setInputValue(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 gap-y-3">
        <Badge variant="outline" onClick={() => { setInputText("Software Engineer internships in New York") }}>
          Software Engineer internships in New York
        </Badge>

        <Badge variant="outline">
          Remote jobs
        </Badge>

        <Badge variant="outline">
          Project Manager jobs in California
        </Badge>

        <Badge variant="outline">
          Data Scientist jobs
        </Badge>
      </div>
      <div className="relative">
        <Textarea
          id="growing-textarea"
          placeholder="Enter your job search criteria here..."
          ref={textareaRef}
          onChange={handleInput}
          rows={defaultRows}
          className="min-h-[none] rounded-lg resize-none"
        />
        <button
          className=" py-0 absolute right-0 top-3 pr-4 bg-none underline underline-offset-4 text-foreground rounded-lg"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (<LoaderCircle size={16} className="animate-spin"/>) : (<Send size={16} />)}
        </button>
      </div>

      {recentSearches.length > 0 && (
        <div className="mt-4 p-2 bg-background rounded">
          <h2 className="font-bold text-lg mb-2">Recent Searches</h2>
          <ul>
            {recentSearches.slice(-3).map((search: string, index: number) => (
              <li key={index} className="border-b py-4 cursor-pointer">
                {search}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 p-2 bg-background rounded">
        {creatingSqlStatus !== "idle" && (renderStatus("Creating SQL Query", creatingSqlStatus))}
        {fetchingLocalStatus !== "idle" && (renderStatus("Fetching Local Jobs", fetchingLocalStatus))}
        {fetchingExternalStatus !== "idle" && (renderStatus("Fetching External Jobs", fetchingExternalStatus))}
        {processingExternalJobsStatus !== "idle" && (renderStatus("Processing External Jobs", processingExternalJobsStatus))}
      </div>

      {/* Local Jobs */}
      {localJobs.length > 0 && (
        <div className="mt-4 p-2 bg-background rounded">
          <h2 className="font-bold text-lg mb-2"> {localJobs.length} Local Jobs</h2>
          <ul>
            {localJobs.map((job: any) => (
              <li key={job.id} className="border-b py-4 cursor-pointer">
                <div className="text-sm text-muted-foreground">{job.company}</div>
                <div>{job.title}</div>
                <div className="text-xs text-muted-foreground">{job.location}</div>
              </li>
            ))}
          </ul>

          {localJobs.length > 10 && (
            <div className="mt-4 underline underline-offset-4">
              View More
            </div>
          )}
        </div>
      )}

      {/* External Jobs */}
      {externalJobs.length > 0 && (
        <div className="mt-4 p-2 bg-background rounded">
          {processingExternalJobsStatus !== "done" ? (
            <div className="flex items-center my-2 text-md font-semibold justify-between">
              <span>Searching for more jobs...</span>
              <Loader2 className="animate-spin" size={16} />
            </div>
          ) : (
            <h2 className="font-bold text-lg mb-2">{externalJobs.length} External Jobs</h2>
          )}
          <ul>
            {externalJobs.map((job, index) => {
              const jc = job.jobContent;
              if (!jc || jc.error) return null;
              return (
                <li key={index} className="border-b py-4 cursor-pointer" onClick={() => window.open(job.url, "_blank")}>
                  <>
                    <div className="flex flex-row gap-4 justify-between">
                      <div className="text-sm text-muted-foreground">{jc.company}</div>
                      <CircleCheck size={16} className="text-green-600" />
                    </div>
                    <div>{jc.title}</div>
                    <div className="text-xs text-muted-foreground">{jc.location}</div>
                  </>
                </li>
              );
            })}
          </ul>
          {/* We are now continuously fetching more in the background, no need for a manual "View More" */}
          {processingExternalJobsStatus === "done" && hasMore && (
            <div className="flex items-center my-2 text-md font-semibold justify-between">
              <span>Fetching more jobs from google...</span>
              <Loader2 className="animate-spin" size={16} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

