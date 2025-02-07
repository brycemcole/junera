import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
const { useAuth } = require('@/context/AuthContext');
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign, LoaderCircle, Clock, Tags, Tag, HandCoins, Eye } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";
import Button24 from "@/components/button24"
import { redirect } from "next/navigation";
import Link from 'next/link';
import ViewStatus from '@/components/ViewStatus';
import { trackJobView } from '@/app/actions/trackJobView';

export const JobList = ({ data, loading, error }) => { 
  const router = useRouter();
  const user = useAuth();

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

  if (!Array.isArray(data)) {
    console.log(data);
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No job postings found.</p>
      </div>
    );
  }

  const handleJobClick = async (jobId) => {
    await trackJobView(jobId);
  };

  return (
    <div className="md:px-0 border-none md:shadow-none max-w-full">
      {data.map((job, index) => (
        <div
          key={index} 
          className="flex flex-row gap-4 group py-3 md:py-3 space-y-0 md:space-y-1 cursor-pointer transition duration-200 ease-in-out max-w-[100vw] md:max-w-4xl"
          onClick={() => handleJobClick(job.id)}
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
            <div className="flex flex-col gap-1">
              <Button24 jobId={job.id} />
              <ViewStatus jobId={job.id} />
            </div>
          </div>
          {/* Header Section */}
          <Link href={{ pathname: `/job-postings/${job.id}`, query: router.query }} onClick={() => handleJobClick(job.id)}>
            <div className="flex flex-col min-w-0 gap-0">
              <h4 className="text-sm text-muted-foreground truncate">
                {job?.company || "No company name available"}
              </h4>
              <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {job?.title || "No job titles available"}
              </h3>
              <div className="flex items-center gap-2 my-2 max-w-full flex-wrap">
                {job?.keywords ?
                  (
                    job.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {keyword}
                      </Badge>
                    ))
                  ) : null}
              </div>
              <div className="leading-7">
                {job?.salary ? (
                  <div className="flex text-foreground items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{job.salary}</span>
                  </div>
                ) : job?.salary_range_str ? (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{job.salary_range_str}</span>
                  </div>
                ) : null}
                {job?.location?.trim() ? (
                  <div className="flex items-center truncate gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className={`${job?.location?.toLowerCase().includes('remote') ? 'text-green-500 dark:text-green-600' : ''}`}>
                      {parseUSLocations(job.location).substring(0, 30)}
                    </span>
                  </div>
                ) : ""}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    {job?.postedDate
                      ? `posted ${formatDistanceToNow(new Date(job.postedDate), {
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
        <div className="flex justify-center py-4">
          <LoaderCircle className="animate-spin" />
        </div>
      )}
    </div>
  );
};

export default JobList;
