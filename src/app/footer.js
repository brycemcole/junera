"use client"
import Link from 'next/link'

const jobCategories = [
  {
    title: 'Popular Jobs',
    links: [
      { name: 'Software Engineer', href: '/job-postings?title=Software%20Engineer' },
      { name: 'Data Scientist', href: '/job-postings?title=Data%20Scientist' },
      { name: 'Project Manager', href: '/job-postings?title=Project%20Manager' },
    ],
  },
  {
    title: 'Experience',
    links: [
      { name: 'Entry Level', href: '/job-postings?explevel=entry%20level' },
      { name: 'Mid Level', href: '/job-postings?explevel=mid%20level' },
      { name: 'Senior Level', href: '/job-postings?explevel=senior' }
    ],
  },
  {
    title: 'Job Types',
    links: [
      { name: 'Remote', href: '/job-postings?location=remote' },
      { name: 'Other', href: '/job-postings' },
    ],
  },
  {
      title: 'Contact Us',
      links: [
        { name: 'About', href: '/about' },,
      ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-black border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-center">
            {jobCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider uppercase mb-4">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Your Company Name. All rights reserved.
          </p>
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