import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign, LoaderCircle, Clock, Tags, Tag } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";
import Button24 from "@/components/button24"
import { redirect } from "next/navigation";
import Link from 'next/link';

export const JobList = ({ data, loading, error }) => { 
  const router = useRouter();
  const [jobData, setJobData] = useState(data);

  useEffect(() => {
    setJobData((prevData) => [...prevData, ...data]);
  }, [data]);

  const stateMap = {
    'remote': 'N/A',
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY',
  };

  const parseUSLocations = (location) => {
    if (!location) return '';

    // Handle remote locations first
    if (location.toLowerCase().includes('remote')) {
      return 'Remote';
    }

    // Reverse map for getting full state names
    const stateToFullName = Object.entries(stateMap).reduce((acc, [full, abbr]) => {
      acc[abbr] = full.replace(/(^|\s)\w/g, letter => letter.toUpperCase());
      return acc;
    }, {});

    // Split locations by semicolon
    const locations = location.split(';');
    const foundStates = new Set();

    locations.forEach(loc => {
      // Try to extract state code from "ST - City" format
      const stateMatch = loc.trim().match(/^([A-Z]{2})\s*-/);
      if (stateMatch && stateToFullName[stateMatch[1]]) {
        foundStates.add(stateToFullName[stateMatch[1]]);
      } else {
        // Handle city names and state names
        const parts = loc.toLowerCase().split(/[,\/|&-]+/);
        parts.forEach(part => {
          const trimmedPart = part.trim();
          if (stateMap[trimmedPart]) {
            foundStates.add(stateToFullName[stateMap[trimmedPart]]);
          } else {
            // Check if city name contains state name
            Object.keys(stateMap).forEach(stateName => {
              if (trimmedPart.includes(stateName)) {
                foundStates.add(stateToFullName[stateMap[stateName]]);
              }
            });
          }
        });
      }
    });

    // Convert Set to Array and format output
    const statesArray = Array.from(foundStates);
    if (statesArray.length === 0) {
      return location; // Return original if no states found
    } else if (statesArray.length === 1) {
      return statesArray[0];
    } else {
      return `Multiple locations: ${statesArray.join(', ')}`;
    }
  };


  const decodeHTMLEntities = (str) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };
  
  const stripHTML = (str) => {
    const allowedTags = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
  
    // Remove disallowed tags
    const elements = doc.body.querySelectorAll('*');
    elements.forEach((el) => {
      if (!allowedTags.includes(el.tagName.toLowerCase())) {
        el.replaceWith(document.createTextNode(el.textContent));
      }
    });
  
    // Reset font size to match the parent
    const allElements = doc.body.querySelectorAll('*');
    allElements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el);
      const parentFontSize = computedStyle.getPropertyValue('font-size');
      el.style.fontSize = parentFontSize; // Reset the font size to parent
    });
  
    return doc.body.innerHTML;
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!Array.isArray(jobData)) {
    console.log(jobData);
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No job postings found.</p>
      </div>
    );
  }
  return (
    <div className="md:px-0 border-none md:shadow-none max-w-full">
      {jobData.map((job, index) => (
        <div
        key={index} className="flex flex-row gap-4 group py-3 md:py-3 space-y-0 md:space-y-1 cursor-pointer transition duration-200 ease-in-out max-w-[100vw] md:max-w-4xl"
        >

<div className="flex flex-col gap-3 justify-between">
{job.company ? (
                <Link href={{ pathname: `/companies/${job.company}`, query: router.query }}>

            <Avatar className="w-9 h-9 rounded-lg flex-shrink-0">
              <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} loading="lazy" />
              <AvatarFallback className="rounded-lg">
                {job.company?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            </Link>
          ) : (
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback>
                {job.company?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <Button24 jobId={job.id} />
          </div>
          {/* Header Section */}
          <Link href={{ pathname: `/job-postings/${job.id}`, query: router.query }}>

          <div className="flex flex-col min-w-0 gap-1">
                <h4 className="text-md text-muted-foreground truncate">
                  {job?.company || "No company name available"}
                </h4>
            <h3 className="font-semibold group-hover:underline text-lg">
              {job?.title || "No job titles available"}
            </h3>
            <div className="text-sm leading-loose line-clamp-3 max-w-full">


            </div>

            <div className="flex gap-2 gap-x-3 text-[13px] text-sm font-medium text-muted-foreground flex-wrap">
            {job?.salary ? (
                <div className="flex text-foreground items-center gap-2">
                  <span className="truncate">{job.salary}</span>
                </div>
              ) : job?.salary_range_str ? (
                <div className="flex items-center gap-2">
                  <span className="truncate">{job.salary_range_str}</span>
                </div>
              ) : null}
                          {job?.keywords ?
                          (
                          <div className="flex items-center gap-2">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{job.keywords.length} tags</span>
                          </div>
                          ) : null}
              {job?.location?.trim() ? (
              <div className="flex items-center truncate gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className={`${job?.location?.toLowerCase().includes('remote') ? 'text-green-500 dark:text-green-600' : ''}`}>
                  {parseUSLocations(job.location).substring(0, 30)}
                </span>
              </div>
              ) : ""}
              {job.experienceLevel !== "null" && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">
                  {job?.experienceLevel ? job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1).toLowerCase() : ""}
                </span>
              </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">
                  {job?.postedDate
                    ? `${formatDistanceToNow(new Date(job.postedDate), {
                        addSuffix: true,
                      })}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
          </Link>

        </div>
      ))}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <LoaderCircle className="animate-spin h-6 w-6" />
        </div>
      )}
    </div>
  );
};

export default JobList;
