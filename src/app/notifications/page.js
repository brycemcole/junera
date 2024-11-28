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
  }, [user, router]);

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    if (notification.type === 'job_match' && notification.jobId) {
      router.push(`/job-postings/${notification.jobId}`);
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
    const counts = {
      all: notifications.length,
    };
    
    // Count notifications by type
    notifications.forEach(notification => {
      counts[notification.type] = (counts[notification.type] || 0) + 1;
    });
    
    return counts;
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

      </div>
      <div className="flex gap-2 flex-wrap mb-6">
          <NumberButton
            variant={selectedType === 'all' ? "disabled" : "outline"}
            onClick={() => setSelectedType('all')}
            className="flex gap-2 items-center"
            count={notificationCounts.all}
            text="All"
          >
            <Badge variant="secondary">{notificationCounts.all}</Badge>
          </NumberButton>
          {Object.entries(notificationTypes).map(([type, { icon, label }]) => (
            <NumberButton
            text={icon +  ' ' + label}
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
<div className={`flex grow gap-3 ${notification.type === 'job_match' ? 'cursor-pointer' : ''}`}
onClick={() => handleNotificationClick(notification)} key={notification.id}
  >
{notificationType.icon}
          <div className="flex grow flex-col gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{notificationType.label || notification.type}</p>
              <p className="text-gray-500 text-sm">{new Date(notification.createdAt).toLocaleString()}</p>

              <p className="text-sm text-muted-foreground">
              {notification.senderUserId ? (
                <>From: {notification.senderFirstName} {notification.senderLastName}</>
              ) : (
                <>{notification.important_message}</>
              )}
              </p>
            </div>
            <div>
              <Button size="sm"> View </Button>
            </div>
          </div>
        </div>
          );
        })}
      </div>
    </div>
  );
}

