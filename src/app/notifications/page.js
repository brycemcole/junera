"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import axios from 'axios';
import { formatDistanceToNow } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { X, Loader2, ChevronsUpDown } from "lucide-react";
import NumberButton from "@/components/ui/number-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInView } from 'react-intersection-observer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const notificationTypes = {
  job_match: {
    icon: '💼',
    label: 'Job Match'
  },
  system: {
    icon: '🔔',
    label: 'System'
  },
  message: {
    icon: '✉️',
    label: 'Message'
  }
};

export default function Notifications() { // Renamed component
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [sortFilter, setSortFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const { ref, inView } = useInView();

  const fetchNotifications = async (pageNum) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/api/notifications?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const newNotifications = response.data?.notifications || [];
      const pagination = response.data?.pagination;
      setGroups(response.data?.groups || []);

      setNotifications(prev => (pageNum === 1 ? newNotifications : [...prev, ...newNotifications]));

      setHasMore(pagination ? pageNum < pagination.totalPages : false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
      setHasMore(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.token) {
        router.push('/login');
      } else {
        fetchNotifications(1);
      }
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!isLoading && inView && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [inView, isLoading, hasMore, page]);

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    if (notification.type === 'job_match' && (notification.job_id || notification.jobid)) {
      router.push(`/job-postings/${notification.job_id || notification.jobid}`);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notifications?id=${notificationId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (!Array.isArray(notifications)) return [];

    return notifications.filter(n => {
      const typeMatch = selectedType === 'all' || n.type === selectedType;

      if (sortFilter === 'unread') {
        return typeMatch && !n.is_read;
      } else if (sortFilter === 'read') {
        return typeMatch && n.is_read;
      }
      return typeMatch;
    });
  };

  const getNotificationCounts = () => {
    const counts = {
      all: notifications.length,
      read: notifications.filter(n => n.is_read).length,
      unread: notifications.filter(n => !n.is_read).length
    };

    notifications.forEach(notification => {
      counts[notification.type] = (counts[notification.type] || 0) + 1;
    });

    return counts;
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications?id=${notificationId}`, null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const notificationCounts = getNotificationCounts();

  return (
    <div className="container mx-auto py-10 p-4 max-w-4xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/notifications">Notifications</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button onClick={markAllAsRead} variant="outline">
          Mark all as read
        </Button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Sort Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <NumberButton
          variant={sortFilter === 'all' ? "default" : "outline"}
          onClick={() => setSortFilter('all')}
          text="All"
          count={notificationCounts.all}
        />
        <NumberButton
          variant={sortFilter === 'unread' ? "default" : "outline"}
          onClick={() => setSortFilter('unread')}
          text="Unread"
          count={notificationCounts.unread}
        />
        <NumberButton
          variant={sortFilter === 'read' ? "default" : "outline"}
          onClick={() => setSortFilter('read')}
          text="Read"
          count={notificationCounts.read}
        />
      </div>

      <div className="flex flex-col gap-4 w-full">
        {groups.map((group) => {
          const groupDate = new Date(group.date).toLocaleDateString();
          const groupNotifications = filteredNotifications.filter(
            (n) => new Date(n.createdAt).toLocaleDateString() === groupDate
          );

          return (
            <Collapsible key={group.date}>
              <div className="flex items-center justify-between space-x-4 px-4">
                <h3 className="font-medium mb-2">
                  {group.count} new jobs on {groupDate}
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                {groupNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 flex flex-row gap-4 items-center rounded-lg border-transparent hover:bg-secondary/10 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Avatar className="mr-4">
                      <AvatarImage src={`https://logo.clearbit.com/${notification.senderName}.com`} />
                      <AvatarFallback>{notification.senderName[0]}</AvatarFallback>

                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{notification.metadata.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.senderName}</p>
                      <p className="text-sm text-muted-foreground">{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {hasMore && (
          <div ref={ref} className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
