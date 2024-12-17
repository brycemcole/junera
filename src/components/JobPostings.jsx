import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign, LoaderCircle } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";

export const JobList = ({ data, loading, error }) => { 
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="animate-spin h-6 w-6" />
      </div>
    );
  }

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
  return (
    <div className="border rounded-xl shadow-sm px-4 md:px-0 md:border-none md:shadow-none">
      {data.map((job, index) => (
        <div
          key={job.id}
          className={`${index !== data.length - 1 ? 'border-b' : ''} md:px-6 group py-3 md:py-3 space-y-2 text-sm cursor-pointer md:border md:rounded-xl md:mb-4 transition duration-200 ease-in-out`}
          onClick={() => router.push(`/job-postings/${job.id}`)}
        >
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-1">
            {job.company ? (
              <Avatar className="w-6 h-6">
                  <AvatarImage src={`https://logo.clearbit.com/${job.company}.com`} loading="lazy" />
                  <AvatarFallback>
                  {job.company?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="w-6 h-6">
                <AvatarFallback>
                  {job.company?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                {job?.company || "No company name available"}
              </span>
            </div>
          </div>
          <span className="font-semibold group-hover:underline text-xl">
            
            {job?.title || "No job titles available"}
          </span>
          <div>
            <p className="text-md text-foreground line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: stripHTML(decodeHTMLEntities(job?.description)) }} />
          </div>
          <div className="flex items-center gap-2">
            <ul className="flex flex-wrap gap-2">
            {job.remoteKeyword && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 rounded-md text-sm sm:text-[13px] font-medium border-green-600/10"
              >
                {job.remoteKeyword}
              </Badge>
            )}
              {job.keywords && job.keywords.map((keyword, index) => {
                const colors = [
                  {
                    bg: "bg-blue-500/10",
                    text: "text-blue-600",
                    border: "border-blue-600/10",
                  },
                ];

                const color = colors[index % colors.length]; // Rotate colors based on index

                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`${color.bg} ${color.text} rounded-md text-sm sm:text-[13px] font-medium ${color.border}`}
                  >
                    {keyword}
                  </Badge>
                );
              })}
            </ul>
          </div>
          <div className="my-1 flex gap-y-2 gap-x-4 text-[13px] font-medium text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{job?.location || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-3 w-3 text-muted-foreground" />
              <span>{job?.experienceLevel || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>
                {job?.created_at}
              </span>
            </div>
            {job?.salary ? (
  <div className="flex items-center gap-2">
    <DollarSign className="h-3 w-3 text-muted-foreground" />
    <span>
      {job.salary}
    </span>
  </div>
) : job?.salary_range_str ? (
  <div className="flex items-center gap-2">
    <DollarSign className="h-3 w-3 text-muted-foreground" />
    <span>
      {job.salary_range_str}
    </span>
  </div>
) : null}

          </div>
        </div>
      ))}
    </div>
  );
};

export default JobList;