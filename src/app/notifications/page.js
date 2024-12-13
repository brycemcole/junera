"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import axios from 'axios';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import NumberButton from "@/components/ui/number-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define notification types and icons
const notificationTypes = {
  NEW_USER: { icon: "🌱", label: "User Account Created" },
  NEW_FOLLOWER: { icon: "🙋", label: "New Follower" },
  job_match: { icon: "💼", label: "Job Match" },
  info: { icon: "ℹ️", label: "Information" },
  warning: { icon: "⚠️", label: "Warning" },
};

export default function Login() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        // Fetch notifications with Authorization header
        axios.get('/api/notifications', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
          .then(response => {
            console.log('Notifications:', response.data);
            setNotifications(response.data);
          })
          .catch(error => {
            console.error('Error fetching notifications:', error);
          });
      }
    }
  }, [user, router, loading]);

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    if (notification.type === 'job_match' && notification.related_id) {
      router.push(`/job-postings/${notification.related_id}`);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      await axios.delete(`/api/notifications?id=${notificationId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Add this function to calculate counts
  const getNotificationCounts = () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const counts = {
      all: unreadNotifications.length // Changed from notifications.length
    };

    // Count notifications by type (only unread ones)
    unreadNotifications.forEach(notification => {
      counts[notification.type] = (counts[notification.type] || 0) + 1;
    });

    return counts;
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications?id=${notificationId}`, null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const filteredNotifications = selectedType === 'all'
    ? notifications
    : notifications.filter(n => n.type === selectedType);

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
      <div className="flex gap-2 flex-wrap mb-6">
        <NumberButton
          variant={selectedType === 'all' ? "disabled" : "outline"}
          onClick={() => setSelectedType('all')}
          className="flex gap-2 items-center"
          count={notificationCounts.unread}
          text="All"
        >
          <Badge variant="secondary">{notificationCounts.unread || 0}</Badge>
        </NumberButton>
        {Object.entries(notificationTypes).map(([type, { icon, label }]) => (
          <NumberButton
            text={icon + ' ' + label}
            count={notificationCounts[type] || 0}
            key={type}
            variant={selectedType === type ? "disabled" : "outline"}
            onClick={() => setSelectedType(type)}
            className="flex gap-2 items-center cursor-pointer px-3 py-1"
          >
          </NumberButton>
        ))}
      </div>
      <div className="flex flex-col gap-4 w-full">
        {filteredNotifications.map((notification) => {
          const notificationType = notificationTypes[notification.type] || {};
          return (
            <div
              key={notification.id}
              className={`
                flex items-start p-4 rounded-lg border
                ${notification.type === 'job_match' ? 'cursor-pointer hover:bg-accent' : ''} 
                ${!notification.is_read ? 'bg-secondary/20' : 'bg-card'}
              `}
              onClick={() => handleNotificationClick(notification)}
            >
              {notification.senderLogo ? (
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={notification.senderLogo} alt={notification.senderName} />
                  <AvatarFallback>{notificationType.icon}</AvatarFallback>
                </Avatar>
              ) : (
                <span className="text-2xl mr-4">{notificationType.icon}</span>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{notification.senderName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {notification.type === 'job_match' && (
                    <Badge variant="secondary">Job Match</Badge>
                  )}
                </div>

                <p className="text-sm">{notification.important_message}</p>

                {notification.metadata && notification.type === 'job_match' && (
                  <div className="mt-2 text-sm bg-secondary/10 p-3 rounded-md">
                    <p className="font-medium">{notification.metadata.title}</p>
                    <p className="text-muted-foreground">{notification.metadata.location}</p>
                    {notification.metadata.experienceLevel && (
                      <Badge variant="outline" className="mt-2">
                        {notification.metadata.experienceLevel}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline">
                    {notification.type === 'job_match' ? 'View Job' : 'View'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDelete(notification.id, e)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

