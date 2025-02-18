"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ViewStatusIndicator({ jobId, onViewStatusChange }) {
    const [isViewed, setIsViewed] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // Check initial view status
        const checkViewStatus = async () => {
            try {
                const response = await fetch(`/api/job-postings/${jobId}/view-status`, {
                    headers: user?.token ? {
                        'Authorization': `Bearer ${user.token}`
                    } : {}
                });
                const data = await response.json();
                setIsViewed(data.isViewed);
            } catch (error) {
                console.error('Error checking view status:', error);
            }
        };

        if (user)
        checkViewStatus();

        // Listen for view status changes
        const handleJobViewed = (event) => {
            if (event.detail.jobId === jobId) {
                setIsViewed(event.detail.isViewed);
            }
        };

        window.addEventListener('jobViewed', handleJobViewed);

        return () => {
            window.removeEventListener('jobViewed', handleJobViewed);
        };
    }, [jobId, user]);

    return onViewStatusChange(isViewed);
}
