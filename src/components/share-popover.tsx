// Dependencies: pnpm install lucide-react @remixicon/react

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RiCodeFill, RiFacebookFill, RiMailLine, RiTwitterXFill } from "@remixicon/react";
import { Check, Copy, ShareIcon } from "lucide-react";
import { useRef, useState } from "react";

const sizeVariants = {
  default: {
    button: "h-9 w-9",
    icon: 16
  },
  small: {
    button: "h-8 w-8 min-w-0 p-0 sm:size-9",
    icon: 12
  }
};

export default function SharePopover({
  title,
  size = "default",
  jobId
}: {
  title: string,
  size?: "default" | "small",
  jobId?: string
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update URL generation
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = jobId
    ? `${baseUrl}/job-postings/${jobId}`
    : typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      embed: `<iframe src="${currentUrl}" width="100%" height="600" frameborder="0"></iframe>`
    };

    if (platform === 'embed') {
      navigator.clipboard.writeText(shareUrls.embed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewJob = () => {
    router.push(`/job-postings/${jobId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={sizeVariants[size].button}>
            <ShareIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 mx-6 mt-2">
          <div className="flex flex-col gap-3 text-center">
            <div className="text-sm font-medium">Share job posting</div>
            <div className="text-sm font-medium">{title}</div>
            {jobId && (
              <Button
                variant="outline"
                onClick={handleViewJob}
                className="w-full"
              >
                View Job
              </Button>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                className={sizeVariants[size].button}
                onClick={() => handleShare('embed')}
                aria-label="Copy embed code"
              >
                <RiCodeFill size={sizeVariants[size].icon} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                className={sizeVariants[size].button}
                onClick={() => handleShare('twitter')}
                aria-label="Share on Twitter"
              >
                <RiTwitterXFill size={sizeVariants[size].icon} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                className={sizeVariants[size].button}
                onClick={() => handleShare('facebook')}
                aria-label="Share on Facebook"
              >
                <RiFacebookFill size={sizeVariants[size].icon} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                className={sizeVariants[size].button}
                onClick={() => handleShare('email')}
                aria-label="Share via email"
              >
                <RiMailLine size={sizeVariants[size].icon} strokeWidth={2} aria-hidden="true" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="input-53"
                  className="pe-9"
                  type="text"
                  defaultValue={currentUrl}
                  aria-label="Share link"
                  readOnly
                />
                <button
                  onClick={handleCopy}
                  className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed"
                  aria-label={copied ? "Copied" : "Copy to clipboard"}
                  disabled={copied}
                >
                  <div
                    className={cn(
                      "transition-all",
                      copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                    )}
                  >
                    <Check
                      className="stroke-emerald-500"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                  <div
                    className={cn(
                      "absolute transition-all",
                      copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                    )}
                  >
                    <Copy size={16} strokeWidth={2} aria-hidden="true" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
