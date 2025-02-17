import {
    Avatar,
    AvatarImage,
    AvatarFallback,
  } from "@/components/ui/avatar";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import {
    Briefcase,
    Building2,
    HandCoins,
    MapPin,
    Eye,
    Timer,
    Telescope,
  } from "lucide-react";
  import Link from "next/link";
  import { formatDistanceToNow } from "date-fns";
  import ViewStatusIndicator from "@/components/ViewStatusIndicator"; // Assuming this component exists
  import BookmarkButton from "@/components/BookmarkButton";  //Assuming this component exists
  import ReportPopover from "@/components/ReportPopover"; //Assuming this component exists
  import JobDropdown from "@/components/JobDropdown"; //Assuming this component exists
  
  
  function JobCard({
    jobPosting,
    id,
    keywords,
    handleApplyClick,
    handleSummarizationQuery,
    getFullStateFromLocation, // Helper function, make sure it's defined/imported
  }) {
  
    return (
      <div className="bg-background rounded-lg p-4 md:p-6 border shadow-sm">
  
        {/* Top Section: Company, Title, and Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 sm:w-16 sm:h-16 rounded-lg flex-shrink-0">
            <AvatarImage src={`https://logo.clearbit.com/${jobPosting.company}.com`} />
            <AvatarFallback className="rounded-lg text-lg font-semibold">
              {jobPosting.company?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
  
          <div className="flex-grow">
            <Link
              href={`/companies/${jobPosting.company}`}
              className="text-lg font-semibold text-foreground hover:underline underline-offset-4"
            >
              {jobPosting.company}
            </Link>
            <h2 className="text-xl font-bold tracking-tight">{jobPosting.title}</h2>
          </div>
        </div>
  
  
        {/* Middle Section:  Details & Keywords */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-2">
  
            {/* View Status, Salary, Location, Experience,  Date */}
            <ViewStatusIndicator
              jobId={id}
              onViewStatusChange={(isViewed, viewedAt) => {
                if (!isViewed || !viewedAt) return null;
                return (
                  <div className="flex items-center text-blue-500 gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs">Viewed {formatDistanceToNow(new Date(viewedAt), { addSuffix: true })}</span>
                  </div>
                );
              }}
            />
            {jobPosting.salary && (
              <div className="flex items-center gap-1">
                <HandCoins className="h-3.5 w-3.5" />
                <span className="text-xs">{jobPosting.salary}</span>
              </div>
            )}
            {jobPosting.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs">{jobPosting.location}</span>
              </div>
            )}
            {jobPosting?.experiencelevel && jobPosting.experiencelevel !== 'null' && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="text-xs">{jobPosting.experiencelevel}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              <span className="text-xs">{formatDistanceToNow(jobPosting?.created_at, { addSuffix: true })}</span>
            </div>
          </div>
  
          {/* Keywords */}
          {keywords && keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {keywords.map((keyword, index) => (
                <Link key={index} href={`/job-postings?keywords=${encodeURIComponent(keyword)}`}>
                  <Badge
                    className="text-xs text-green-800 border-green-600/20 bg-green-600/10 px-2 py-1 hover:bg-green-600/20 hover:border-green-600/30 transition-colors"
                    variant="outline"
                  >
                    {keyword}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
  
  
        {/* Bottom Section: Actions & Quick Filters */}
  
        <div className="mt-4 border-t pt-4">  {/* Separator Line */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={jobPosting.source_url}
              target="_blank"
              onClick={handleApplyClick}
              className="flex-1 sm:flex-none"
            >
              <Button className="w-full sm:w-auto text-blue-600 bg-blue-500/10 border border-blue-600/20 hover:bg-blue-500/20 hover:text-blue-500">
                Apply
              </Button>
            </Link>
            <BookmarkButton jobId={id} />
            <ReportPopover jobId={id} />
            <JobDropdown
                handleSummarizationQuery={handleSummarizationQuery}
                jobId={id}
                title={jobPosting.title}
                company={jobPosting.company}
                companyLogo={`https://logo.clearbit.com/${jobPosting.company}.com`}
                location={jobPosting.location}
              />
          </div>
  
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href={`/job-postings?title=${encodeURIComponent(jobPosting.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&strictSearch=false`}>
              <Button variant="outline" size="sm" className="text-sm">
                <Telescope className="w-3.5 h-3.5 mr-1" />
                Similar Titles
              </Button>
            </Link>
            {jobPosting.location && (
              <>
                <Link href={`/job-postings?location=${encodeURIComponent(getFullStateFromLocation(jobPosting.location))}`}>
                  <Button variant="outline" size="sm" className="text-sm">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">Jobs in</span> {getFullStateFromLocation(jobPosting.location)}
                  </Button>
                </Link>
                <Link
                  href={`/job-postings?title=${encodeURIComponent(jobPosting.title.replace(/[()[\]{}]/g, '').replace(/\d+/g, ''))}&location=${encodeURIComponent(getFullStateFromLocation(jobPosting.location))}&strictSearch=false`}
                >
                  <Button variant="outline" size="sm" className="text-sm">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">Similar Jobs</span> Here
                  </Button>
                </Link>
              </>
            )}
            {jobPosting.experiencelevel && jobPosting.experiencelevel !== 'null' && (
              <Link href={`/job-postings?experienceLevel=${encodeURIComponent(jobPosting.experiencelevel)}`}>
                <Button variant="outline" size="sm" className="text-sm">
                  <Briefcase className="w-3.5 h-3.5 mr-1" />
                  {jobPosting.experiencelevel} <span className="hidden sm:inline">Jobs</span>
                </Button>
              </Link>
            )}
            {jobPosting.company && (
              <Link href={`/companies/${encodeURIComponent(jobPosting.company)}`}>
                <Button variant="outline" size="sm" className="text-sm">
                  <Building2 className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">More at</span> {jobPosting.company}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  export default JobCard;