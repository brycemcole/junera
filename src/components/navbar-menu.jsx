"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { BookMarked, BriefcaseBusiness, Navigation, Star } from "lucide-react"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from '@/context/AuthContext';

const components = [
  {
    title: "All Job Postings",
    href: "/job-postings",
    description: "Browse all available job postings.",
  },
  {
    title: "Remote",
    href: "/job-postings?location=remote",
    description: "Find remote job opportunities.",
  },
  {
    title: "Internships",
    href: "/job-postings?explevel=internship",
    description: "Find internship opportunities to gain experience.",
  },
  {
    title: "Entry Level",
    href: "/job-postings?explevel=entry",
    description: "Jobs for candidates with minimal professional experience.",
  },
  {
    title: "Software Engineer",
    href: "/job-postings?title=Software%20Engineer",
    description: "Explore software engineering roles at various levels.",
  },
  {
    title: "Project Manager",
    href: "/job-postings?title=Project%20Manager",
    description: "Open positions for project management professionals.",
  },
  {
    title: "New York",
    href: "/job-postings?location=new%20york",
    description: "Jobs located in New York.",
  },
  {
    title: "California",
    href: "/job-postings?location=california",
    description: "Jobs located in California.",
  },
];



export function NavbarMenu() {
  const { user, logout, loading } = useAuth();
  let username;
  if (!loading) {
    username = user?.username || "unknown";
  }
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Home</NavigationMenuTrigger>
          <NavigationMenuContent className="z-[60]">
            <ul className="grid gap-3 p-6 z-100 opacity-100 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link href="/" className="flex h-full w-full select-none flex-col justify-end rounded-md bg-emerald-50 dark:bg-emerald-950/50 from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                    <div className="mb-2 mt-4 text-lg font-medium">
                      🌳 junera
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      A new job search experience, powering the future of work.
                    </p>
                    </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/" title="Introduction">
                Get to know the platform and what it can do for your job search.
              </ListItem>
              <ListItem href="/about" title="About Us">
                Information about junera, the team, and our mission.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Job Postings</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}

{user && !loading ? (
  <>
  <ListItem href="/job-postings/applied" title={<>Your Jobs<BriefcaseBusiness className="float-right mr-2" size={14} /></>}>
    Manage your job applications and profile.
  </ListItem>
  <ListItem href="/saved" title={<>Bookmarked Jobs<BookMarked className="float-right mr-2" size={14} /></>}>
    Manage your job applications and profile.
  </ListItem>
  </>
) : (
  <ListItem href="/login" title="Login">
    Sign in to access your dashboard.
  </ListItem>
)}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {user && !loading ? (
            <>
        <NavigationMenuItem className="bg-transparent">
          <Link href="/dashboard" legacyBehavior passHref>
            <NavigationMenuLink className={`bg-transparent ${navigationMenuTriggerStyle()}`}>
              Dashboard
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Profile</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 z-100 opacity-100 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link href="/" className="flex h-full w-full select-none flex-col justify-end rounded-md bg-emerald-50 dark:bg-emerald-950/50 from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                    <div className="mb-2 mt-4 text-lg font-medium">
                      {user.username}
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">

                    </p>
                    </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/profile" title="Profile">
                {user.username}&apos;s profile
              </ListItem>
              <ListItem href="/notifications" title="Notifications">
                View your notifications
              </ListItem>
              <ListItem href="#" title="Logout" onClick={logout}>
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
          <Link href="/p/[username]" as={`/p/${username}`} passHref>
          </Link>
        </>
        ) : (
          <>
          <NavigationMenuItem>
            <Link href="/login" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Login
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/register" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Register
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          </>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = (({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-900/30 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
