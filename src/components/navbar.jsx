"use client";
import Link from 'next/link';
import Button23 from './button23';
import { Button } from "@/components/ui/button"
const { useState } = require("react");
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { NavbarMenu } from '@/components/navbar-menu';
import {
  Info,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home } from 'lucide-react';
import { User } from 'lucide-react';
import { UserPlus } from 'lucide-react';
import { Bell } from 'lucide-react';

export function DropdownMenuDemo() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="group"
          variant="outline"
          size="icon"
          onClick={() => setOpen((prevState) => !prevState)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg
            className="pointer-events-none"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12L20 12"
              className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
            />
            <path
              d="M4 12H20"
              className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
            />
            <path
              d="M4 12H20"
              className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-4 mt-3">
        <DropdownMenuGroup>
          {user && (
            <>
              <DropdownMenuLabel>
                Welcome back, {user.username}
              </DropdownMenuLabel>
              <Link href="/dashboard">
                <DropdownMenuItem>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/notifications">
                <DropdownMenuItem>
                  <Bell />
                  <span>Notifications</span>
                </DropdownMenuItem>
              </Link>
            </>
          )}
          <Link href="/">
            <DropdownMenuItem>
              <Home />
              <span>Home</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />

          <Link href="/about">
            <DropdownMenuItem>
              <Info />
              <span>About</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <BriefcaseBusiness />
              <span>Job Postings</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => router.push('/job-postings')}>
                  <span>Browse</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/job-postings?explevel=internship')}>
                  <span>Internships</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/job-postings?explevel=entry')}>
                  <span>Entry Level</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Careers</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/job-postings?title=Software%20Engineer')}>
                  <span>Software Engineer</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/job-postings?title=Project%20Manager')}>
                  <span>Project Manager</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Locations</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/job-postings?location=new%20york')}>
                  <span>New York</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/job-postings?location=california')}>
                  <span>California</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {user ? (
            <>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <Link href="/login">
                <DropdownMenuItem>
                  <User />
                  <span>Login</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/register">
                <DropdownMenuItem>
                  <UserPlus />
                  <span>Register</span>
                </DropdownMenuItem>
              </Link>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-background border-b border-muted-accent">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center max-w-4xl">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <span className="text-2xl">🌳</span>
          </Link>
          <span className="text-sm font-mono">junera</span>
        </div>
        <div className="hidden md:flex space-x-4">
          <NavbarMenu />
        </div>
        <div className="md:hidden">
          <DropdownMenuDemo />
        </div>
      </div>
    </nav>
  );
}