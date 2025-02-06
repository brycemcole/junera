"use client"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Footer() {
  return (
    <footer className="w-full bg-background  py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-foreground">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-foreground">
            <span className="whitespace-nowrap"><Link href="/job-postings">Browse Jobs</Link></span>
            <span className="hidden sm:inline ">•</span>
            <span className="whitespace-nowrap"><Link href="/job-postings?explevel=internship">Internships</Link></span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap"><Link href="/job-postings?location=remote">Remote</Link></span>
            <span className="hidden sm:inline ">•</span>
            <span className="whitespace-nowrap"><Link href="/about">About</Link></span>
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            junera {new Date().getFullYear()}
          </span>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            <Link href="https://x.com/br3dev">
              contact
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}

/*
import { Pin, Code, User, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  {
    href: "/job-postings",
    icon: <BriefcaseBusiness size={16} />,
    text: "Job Postings",
  },
  {
    href: "/job-postings?explevel=entry%20level",
    icon: <User size={16} />,
    text: "Entry Level Jobs",
  },
  {
    href: "/job-postings?location=California",
    icon: <Pin size={16} />,
    text: "Jobs in California",
  },
  {
    href: "/job-postings?location=New%20York",
    icon: <Pin size={16} />,
    text: "Jobs in New York",
  },
  {
    href: "/job-postings?title=Software%20Engineer",
    icon: <Code size={16} />,
    text: "Software Engineer Jobs",
  },
  {
    href: "/job-postings?title=Project%20Manager",
    icon: <Code size={16} />,
    text: "Project Manager Jobs",
  },
  {
    href: "/job-postings?explevel=mid%20level",
    icon: <User size={16} />,
    text: "Mid-Level Jobs",
  },
  {
    href: "/job-postings?explevel=senior",
    icon: <User size={16} />,
    text: "Senior Level Jobs",
  },
  {
    href: "/job-postings?location=Texas",
    icon: <Pin size={16} />,
    text: "Jobs in Texas",
  },
  {
    href: "/job-postings?location=Florida",
    icon: <Pin size={16} />,
    text: "Jobs in Florida",
  },
  {
    href: "/job-postings?title=Data%20Scientist",
    icon: <Code size={16} />,
    text: "Data Scientist Jobs",
  },
  {
    href: "/job-postings?title=Product%20Manager",
    icon: <Code size={16} />,
    text: "Product Manager Jobs",
  },
  {
    href: "/job-postings?company=86",
    icon: <Code size={16} />,
    text: "Microsoft Jobs",
  },
  {
    href: "/job-postings?company=421",
    icon: <Code size={16} />,
    text: "Anthropic Jobs",
  },
];

export default function Footer() {
  return (
    <footer className="row-start-3 flex gap-6 mb-6 flex-wrap items-center justify-center">
      <div className="flex px-4 flex-wrap gap-0 max-w-4xl justify-between gap-y-8">
        {footerLinks.map(({ href, icon, text }) => (
          <Link key={href} href={href}>
            <p className="flex items-center gap-2 hover:underline hover:underline-offset-4">
              {icon}
              {text}
            </p>
          </Link>
        ))}
      </div>
    </footer>
  );
}
  */