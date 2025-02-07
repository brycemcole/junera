"use client";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useState, useEffect, use } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { NavbarMenu } from '@/components/navbar-menu';
import { Info, BriefcaseBusiness, LayoutDashboard, LogOut, Home, User, UserPlus, Bell, Bookmark, Bot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuShortcut, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar"

export function ButtonDemo() {
  const { user, logout } = useAuth();
  return (
    <Button className="rounded-full h-8 py-0 ps-0 mr-3">
      <div className="flex aspect-square h-full p-1.5">
        <Image
          className="h-auto w-full rounded-full"
          src={`https://avatars.dicebear.com/api/avataaars/georgelucas.svg`}
          alt="Profile image"
          width={20}
          height={20}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs">
      @{user?.username}
      </span>
    </Button>
  );
}


function Dot({ className }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

function AvatarButton({ image, fullname, unreadCount }) {
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.length >= 2 
      ? `${names[0][0]}${names[names.length-1][0]}`
      : name[0];
  };

  return (
    <div className="relative">
      <Avatar className="rounded-lg h-8 w-8">
        <AvatarImage src={image} alt={fullname} />
        <AvatarFallback className="rounded-lg">
          {getInitials(fullname)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}


function DropdownMenuDemo2() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (user) {
        const result = await fetch('/api/notifications/count', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await result.json();
        const count = Array.isArray(data) ? data[0].count : data.count;
        setUnreadCount(parseInt(count, 10) || 0);
      }
    })();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="group h-7 w-7"
          variant="ghost"
          size="icon"
          onClick={() => setOpen((prevState) => !prevState)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <AvatarButton image={user?.avatar} fullname={user?.username} unreadCount={unreadCount} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-4 mt-4">
       
         <DropdownMenuGroup>
          {user && (
            <>
            <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{user.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/notifications')}>
                  <Bell />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                  <DropdownMenuShortcut>
                      <>
                      {unreadCount > 99 ? "99+" : unreadCount}
                      </>
                  </DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/job-postings/my-jobs')}>
                  <BriefcaseBusiness/>
                  <span>My Jobs</span>
                </DropdownMenuItem>
            </>
          )}
          {user ? (
            <>
                                  <DropdownMenuSeparator />
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
  );
}
function DropdownMenuDemo() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className="group shadow-sm h-8 w-8"
          variant="outline"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg
            className="pointer-events-none"
            width={20}
            height={20}
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
              className={`origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] ${open ? 'translate-x-0 translate-y-0 rotate-[315deg]' : ''}`}
            />
            <path
              d="M4 12H20"
              className={`origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] ${open ? 'rotate-45 ' : ''}`}
            />
            <path
              d="M4 12H20"
              className={`origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] ${open ? 'hidden rotate-[45deg]' : ''}`}
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-4 mt-4">
        <DropdownMenuGroup>
          <Link href="/">
            <DropdownMenuItem>
              <Home />
              <span>Home</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
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
                {user && !loading && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/job-postings/my-jobs')}>
                      <span>Your Jobs</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
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

          {user ? (
            <>
              <DropdownMenuItem onClick={() => router.push('/agents')}>
                <Bot />
                <span>Agents</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <LayoutDashboard />
                <span>Dashboard</span>
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
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </Link>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  if (!initialized) {
    return null; // Or return a minimal loading navbar
  }

  return (
    <nav className="backdrop-blur shadow-md bg-background/50 lg:max-w-[900px] max-w-4xl sm:mx-8 mx-4 lg:mx-auto shadow-sm z-50 m-4 border rounded-xl mb-0 border-muted-accent/40 fixed top-0 left-0 right-0">
      <div className="flex flex-row justify-between px-4 py-2 z-100">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <span className="text-2xl">🌳</span>
          </Link>
          <span className="text-sm font-[family-name:var(--font-geist-sans)]">junera</span>
        </div>
        <div className="hidden md:block space-x-4 z-1000 ml-auto">
          <NavbarMenu/>
        </div>
        <div className="md:hidden items-center flex gap-4">
          {initialized && (
            <>
              {user ? (
                <DropdownMenuDemo2 />
              ) : (
                <Button className="bg-green-500/20  border border-green-600/30 text-green-700 shadow-sm hover:text-primary hover:bg-green-500/30 rounded-lg px-2.5 py-1.5 h-8">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </>
          )}
          <DropdownMenuDemo />
        </div>
      </div>
    </nav>
  );
}