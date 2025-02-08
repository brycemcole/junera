import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from 'next/link';
import ViewStatus from '@/components/ViewStatus';
import { trackJobView } from '@/app/actions/trackJobView';
import { Badge } from "@/components/ui/badge";  // Moved Badge here for better organization
import Button24 from "@/components/button24"

// Simplified and improved DateDisplay component
function DateDisplay({ postedDate }) {
  if (!postedDate) {
    return "N/A";
  }

  const date = new Date(postedDate);
  return (
    <span className="text-muted-foreground text-sm">
      {formatDistanceToNow(date, { addSuffix: true, includeSeconds: false })}
    </span>
  );
}


// Helper function to normalize location strings (handle casing and spacing)
function normalizeLocation(location) {
    if (!location) return "";
    return location.toLowerCase().trim();
}


// Much more robust and readable location parsing
function parseUSLocations(location) {
    if (!location) return '';

    const stateMap = {
        'remote': 'N/A',
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
        'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
        'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
        'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
        'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
        'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
        'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
        'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    };

    const normalizedLocation = normalizeLocation(location);

    if (normalizedLocation.includes('remote')) {
        return 'Remote';
    }

    const stateAbbreviations = new Set();

    // Split by common delimiters, handle multiple locations
    const locationParts = normalizedLocation.split(/[,;|\/&]+/);

    for (const part of locationParts) {
        const trimmedPart = part.trim();

        // Check for direct state abbreviations (e.g., "CA")
        if (Object.values(stateMap).includes(trimmedPart.toUpperCase())) {
            stateAbbreviations.add(trimmedPart.toUpperCase());
            continue;
        }

        //check for "ST -" format
        const stateMatch = trimmedPart.match(/^([a-z]{2})\s*-/);
        if (stateMatch && Object.values(stateMap).includes(stateMatch[1].toUpperCase())) {
          stateAbbreviations.add(stateMatch[1].toUpperCase());
          continue;
        }

        // Check for full state names
        for (const stateName in stateMap) {
            if (trimmedPart.includes(stateName)) {
                stateAbbreviations.add(stateMap[stateName]);
                break; // Important: Stop after finding the first match within the part
            }
        }
    }

    // Format output
    if (stateAbbreviations.size === 0) {
        return location; // Return original if no states found
    } else if (stateAbbreviations.size === 1) {
        return Array.from(stateAbbreviations)[0]; // Return single abbreviation
    } else {
        return `Multiple locations: ${Array.from(stateAbbreviations).join(', ')}`;
    }
}


// Removed decodeHTMLEntities and stripHTML - not needed if the backend handles HTML escaping

export const JobList = ({ data, loading, error }) => {
    const router = useRouter();

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    // Handle case where data might be an object (not an array) and no jobs are found
    if (!Array.isArray(data)) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No job postings found.</p>
            </div>
        );
    }


    const handleJobClick = async (jobId) => {
        await trackJobView(jobId);
        // Next.js handles navigation, no need for window.open
        // router.push(`/job-postings/${jobId}`);  // You can still push if needed, but Link component usually sufficient
    };

    return (
        <div className="md:px-0 border-none md:shadow-none max-w-full">
            {data.map((job, index) => (
                <div
                    key={job.id || index} // Use job.id if available, otherwise index
                    className="flex flex-row items-center gap-4 group py-3 md:py-3  cursor-pointer transition duration-200 ease-in-out max-w-[100vw] md:max-w-4xl border-b border-gray-200/50 last:border-none"
                >
                    {/* Avatar */}
                    <div className="flex flex-col gap-3 justify-between">
                      {job.company ? (
                        <Link href={{ pathname: `/companies/${job.company}`, query: router.query }}>
                          <Avatar className="w-10 h-10 rounded-full flex-shrink-0">
                            <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} loading="lazy" />
                            <AvatarFallback className="rounded-full">
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
                        <ViewStatus jobId={job.id} />
                    </div>
                  </div>

                    {/* Job Details */}
                   <Link href={{ pathname: `/job-postings/${job.id}`, query: router.query }} onClick={() => handleJobClick(job.id)}>
                      <div className="flex flex-col min-w-0 gap-0">
                        <h3 className="scroll-m-20 text-md text-foreground font-semibold tracking-tight">
                            <span className="font-semibold text-gray-500">{job?.company || "No company name available"}</span>
                            <span className="mx-[3px]"></span> {/* Consistent spacing */}
                            <span>{job?.title || "No job titles available"}</span>
                        </h3>
                        <div className="leading-6 text-sm flex flex-row flex-wrap gap-2 ">
                            {job?.salary || job?.salary_range_str ? (
                                <Badge variant="outline" className="truncate border-emerald-500 text-emerald-500">
                                    {job.salary || job.salary_range_str}
                                </Badge>
                            ) : null}
                          {job?.location?.trim() && (

                                <Badge
                                    variant="outline"
                                    className={`truncate border-gray-400  ${job?.location?.toLowerCase().includes('remote') ? 'text-green-500 border-green-500 dark:text-green-600' : 'text-gray-500'
                                        }`}
                                >
                                     {parseUSLocations(job.location).substring(0, 30)}
                                </Badge>
                            )}
                            <DateDisplay postedDate={job.postedDate} />
                        </div>
                    </div>
                  </Link>
                </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-center py-4">
                    <LoaderCircle className="animate-spin" />
                </div>
            )}
        </div>
    );
};

export default JobList;