"use client";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useState, useEffect, use } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { NavbarMenu } from '@/components/navbar-menu';
import { Info, BriefcaseBusiness, LayoutDashboard, LogOut, Home, User, UserPlus, Bell, Bookmark } from "lucide-react";
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
  return (
    <div className="relative">
      <Avatar className="rounded-lg">
        <AvatarImage src={image} alt={fullname} />
        <AvatarFallback>
          {fullname?.split(' ').map(name => name[0]).join('')}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}


function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (user) {
      setLoading(true);
      axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then(response => {
          // Transform API response to match our UI format
          const formattedNotifications = response.data.map(n => ({
            id: n.id,
            image: n.senderLogo || `https://avatars.dicebear.com/api/avataaars/${n.senderUsername}.svg`,
            user: n.senderName,
            action: n.type === 'job_match' ? 'matched you with' : 'sent',
            target: n.type === 'job_match' ? n.metadata?.title || 'Job Posting' : n.important_message,
            timestamp: n.createdAt,
            is_read: n.is_read, // Changed from unread: !n.is_read
            type: n.type
          }));
          setNotifications(formattedNotifications);
        })
        .catch(error => console.error('Error loading notifications:', error))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.map(notification => ({
        ...notification,
        unread: false
      })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (id) => {
    try {
      await axios.put(`/api/notifications?id=${id}`, null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, unread: false } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="relative" aria-label="Open notifications">
          <Bell size={16} strokeWidth={2} aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1 mr-4 mt-4">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <button className="text-xs font-medium hover:underline" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="-mx-1 my-1 h-px bg-border"
        ></div>
        {loading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="px-3 py-2">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <div className="relative flex items-start gap-3 pe-3">
                <Image
                  className="size-9 rounded-md"
                  src={notification.image}
                  width={32}
                  height={32}
                  alt={notification.user}
                />
                <div className="flex-1 space-y-1">
                  <button
                    className="text-left text-foreground/80 after:absolute after:inset-0"
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <span className="font-medium text-foreground hover:underline">
                      {notification.user}
                    </span>{" "}
                    {notification.action}{" "}
                    <span className="font-medium text-foreground hover:underline">
                      {notification.target}
                    </span>
                    .
                  </button>
                  <div className="text-xs text-muted-foreground">{notification.timestamp}</div>
                </div>
                {notification.is_read === false && ( // Changed from notification.unread
                  <div className="self-center absolute end-0">
                    <Dot />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </PopoverContent>
    </Popover>
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
          className="group"
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
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
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
                <DropdownMenuItem onClick={() => router.push('/saved')}>
                  <Bookmark/>
                  <span>Saved</span>
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
          variant="ghost"
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
                {user && !loading ? (
            <>
                            <DropdownMenuItem onClick={() => router.push('/job-postings/applied')}>
                  <span>Your Jobs</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                </>
          ) : (
          <></>)}
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
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="backdrop-blur bg-background lg:max-w-[900px] max-w-4xl md:max-w-[750px] mx-4 md:mx-auto shadow-sm z-100 m-4 border rounded-lg mb-0 border-muted-accent ">
      <div className="flex flex-row justify-between px-4 py-2 z-100">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <span className="text-2xl">🌳</span>
          </Link>
          <span className="text-sm font-mono">junera</span>
        </div>
        <div className="hidden md:block space-x-4 z-1000 ml-auto">
          <NavbarMenu/>
        </div>
        <div className="md:hidden items-center flex gap-2">
          {user ? (
        <DropdownMenuDemo2 />
      ) : (
        <>
        <Button variant="ghost" className="text-customGreen h-8 font-semibold dark:text-white hover:text-primary hover:bg-accent">
          <Link href="/register">
           Sign Up
          </Link>
        </Button>
        <Button className="font-semibold h-8 hover:text-primary hover:bg-accent">
          <Link href="/login">
           Login
          </Link>
        </Button>
        </>
      )}
          <DropdownMenuDemo />
        </div>
      </div>
    </nav>
  );
}