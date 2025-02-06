"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Button24 from "@/components/button24"


export const ExampleJobPostings = () => {
  const router = useRouter();
  const [data, setData] = React.useState([]);

    React.useEffect(() => {
        fetch("/api/job-postings?title=software+engineer")
            .then((res) => res.json())
            .then((data) => setData(data.jobPostings))
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

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

if (!data) {
    return <>
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    </>;
  } else if (data.length === 0) {
    return <>
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    <Skeleton className="mx-auto h-[20px] rounded-full" />
    </>;
  }

  return (
    <div className="border rounded-xl h-[225px] w-full  mx-auto px-4 overflow-y-scroll overflow-x-auto">
      {data.map((job, index) => (
        <div
          key={job.id}
          className="flex flex-row gap-4 group py-3 md:py-3 space-y-0 md:space-y-1 cursor-pointer transition duration-200 ease-in-out max-w-[100vw] md:max-w-4xl"
          onClick={() => router.push(`/job-postings/${job.id}`)}
        >

<div className="flex flex-col justify-between">
{job.company ? (
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} loading="lazy" />
              <AvatarFallback>
                {job.company?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
          <div className="flex flex-col min-w-0">
                <span className="text-sm text-muted-foreground truncate">
                  {job?.company || "No company name available"}
                </span>
            <span className="font-semibold group-hover:underline text-md truncate">
              {job?.title || "No job titles available"}
            </span>
            <div className="text-sm line-clamp-2 max-w-full">
              <p
                className="m-0 text-foreground"
                dangerouslySetInnerHTML={{
                  __html: stripHTML(decodeHTMLEntities(job?.description)),
                }}
              />
            </div>

            <div className="flex md:gap-y-2 gap-x-4 text-[13px] text-sm font-medium text-muted-foreground flex-wrap">
              {job?.location?.trim() ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className={`${job?.location?.toLowerCase().includes('remote') ? 'text-green-500 dark:text-green-600' : ''}`}>
                  {job.location}
                </span>
              </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{job?.experienceLevel || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">
                  {job?.postedDate
                    ? `${formatDistanceToNow(new Date(job.postedDate), {
                        addSuffix: true,
                      })}`
                    : "N/A"}
                </span>
              </div>
              {job?.salary ? (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{job.salary}</span>
                </div>
              ) : job?.salary_range_str ? (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{job.salary_range_str}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExampleJobPostings;