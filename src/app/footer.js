"use client";
import { Pin, Code, User, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  {
    href: "/job-postings",
    icon: <BriefcaseBusiness className="text-muted-foreground" size={14} />,
    text: "Job Postings",
  },
  {
    href: "/job-postings?explevel=entry",
    icon: <User className="text-muted-foreground" size={14} />,
    text: "Entry Level Jobs",
  },
  {
    href: "/job-postings?location=California",
    icon: <Pin className="text-muted-foreground" size={14} />,
    text: "Jobs in California",
  },
  {
    href: "/job-postings?location=New%20York",
    icon: <Pin className="text-muted-foreground" size={14} />,
    text: "Jobs in New York",
  },
  {
    href: "/job-postings?title=Software%20Engineer",
    icon: <Code className="text-muted-foreground" size={14} />,
    text: "Software Engineer Jobs",
  },
];

export default function Footer() {
  return (
    <footer className="row-start-3 flex gap-3 mb-6 flex-wrap items-center justify-center">
      <div className="flex px-4 flex-wrap gap-0 max-w-4xl justify-between gap-y-4">
        {footerLinks.map(({ href, icon, text }) => (
          <Link key={href} href={href}>
            <p className="flex items-center text-xs gap-2 hover:underline hover:underline-offset-4">
              {icon}
              {text}
            </p>
          </Link>
        ))}
      </div>
    </footer>
  );
}