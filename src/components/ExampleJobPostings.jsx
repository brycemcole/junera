"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const ExampleJobPostings = () => {
  const router = useRouter();
  const [data, setData] = React.useState([]);

    React.useEffect(() => {
        fetch("/api/job-postings?title=software+engineer")
            .then((res) => res.json())
            .then((data) => setData(data.jobPostings?.slice(0, 2)))
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
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    </>;
  } else if (data.length === 0) {
    return <>
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    <Skeleton className="w-2/3 mx-auto h-[20px] rounded-full" />
    </>;
  }

return (
    <div className="border rounded-xl w-2/3 mx-auto px-4">
        {data.map((job) => (
            <div
                key={job.id}
                className="border-b md:px-2 py-2 md:py-3 space-y-2 text-xs cursor-pointer transition duration-200 ease-in-out"
                onClick={() => router.push(`/job-postings/${job.id}`)}
            >
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-1">
                    {job.logo ? (
                        <Avatar className="w-3 h-3 text-[10px]">
                            <AvatarImage src={job.logo} />
                            <AvatarFallback>
                                {job.company?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <Avatar className="w-3 h-3 text-[10px]">
                            <AvatarFallback>
                                {job.company?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                            {job?.company || "No company name available"}
                        </span>
                    </div>
                </div>
                <span className="font-semibold text-sm">
                    {job?.title || "No job titles available"}
                    {job.remoteKeyword && (
                        <span className="ml-2 text-green-600">
                            Remote
                            </span>
                        )}
                </span>
                <div className="my-1 flex gap-y-2 gap-x-4 text-[10px] font-medium text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-2 w-2 text-muted-foreground" />
                        <span>{job?.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    {job?.experienceLevel !== "Unknown" ?
                    (
                        <><Briefcase className="h-2 w-2 text-muted-foreground" />
                        <span>{job?.experienceLevel !== "Unknown" ? job?.experienceLevel : "N/A"}</span>
                        </>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-2 w-2 text-muted-foreground" />
                        <span>
                            {job.postedDate}
                        </span>
                    </div>
                    {(job?.salary && Number(job.salary) > 0) || job?.salary_range_str ? (
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-2 w-2 text-foreground" />
                            <span>
                                {Number(job.salary) > 0
                                    ? Number(job.salary).toLocaleString()
                                    : job.salary_range_str}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        ))}
        <div className="text-center pb-3 pt-1">
            <button
                className="text-xs text-primary hover:underline underline-offset-4"
                onClick={() => router.push("/job-postings")}
            >
                View more job postings
            </button>
            </div>
    </div>
);
};

export default ExampleJobPostings;