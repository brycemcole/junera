import React from "react";
import { useRouter } from "next/router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";

const JobList = ({ data }) => {
  const router = useRouter();

  const stripHTML = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  return (
    <>
      {data.map((job) => (
        <div
          key={job.id}
          className="border-b md:px-6 py-6 md:py-4 space-y-2 text-sm cursor-pointer md:border md:rounded-xl md:mb-4 transition duration-200 ease-in-out"
          onClick={() => router.push(`/job-postings/${job.id}`)}
        >
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-1">
            {job.logo ? (
              <Avatar className="w-6 h-6">
                <AvatarImage src={job.logo} />
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
          <span className="font-semibold text-xl">
            {job?.title || "No job titles available"}
          </span>
          <div className="text-md text-foreground line-clamp-3 leading-relaxed">
            {stripHTML(job?.description) || "No description available"}
          </div>
          <div className="flex items-center gap-2">
            {job.remoteKeyword && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 rounded-md text-sm sm:text-[13px] font-medium border-green-600/10"
              >
                {job.remoteKeyword}
              </Badge>
            )}
            <ul className="flex flex-wrap gap-2">
              {job.keywords.map((keyword, index) => {
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
                {job?.postedDate
                  ? `${formatDistanceToNow(new Date(job.postedDate), {
                      addSuffix: true,
                    })}`
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
      ))}
    </>
  );
};

export default JobList;