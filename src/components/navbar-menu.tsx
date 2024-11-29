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
import { Navigation } from "lucide-react"

const { useAuth } = require('@/context/AuthContext');

const components: { title: string; href: string; description: string }[] = [
  {
    title: "All Job Postings",
    href: "/job-postings",
    description: "Browse all available job postings.",
  },
  {
    title: "Internships",
    href: "/job-postings?explevel=internship",
    description: "Find internship opportunities to gain experience.",
  },
  {
    title: "Entry Level",
    href: "/job-postings?explevel=entry%20level",
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
  const { user, logout } = useAuth();
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Home</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-lime-50 dark:bg-lime-950/50 from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">
                      🌳 junera
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      A new job search experience, powering the future of work.
                    </p>
                  </a>
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
          <NavigationMenuTrigger>Job Postings</NavigationMenuTrigger>
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
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {user ? (
            <>
        <NavigationMenuItem>
          <Link href="/dashboard" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Dashboard
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem onClick={logout}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Logout
              </NavigationMenuLink>
          </NavigationMenuItem>
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

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lime-50/60 dark:hover:bg-lime-900/30 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
