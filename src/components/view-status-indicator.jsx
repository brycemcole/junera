"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ViewStatusIndicator({ jobId, onViewStatusChange }) {
    const [isViewed, setIsViewed] = useState(false);
    const { user } = useAuth();
    const componentRef = useRef(null);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (!componentRef.current || !user || hasChecked) return;

        const checkViewStatus = async () => {
            try {
                const response = await fetch(`/api/job-postings/${jobId}/view-status`, {
                    headers: user?.token ? {
                        'Authorization': `Bearer ${user.token}`
                    } : {}
                });
                const data = await response.json();
                setIsViewed(data.isViewed);
                setHasChecked(true);
            } catch (error) {
                console.error('Error checking view status:', error);
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !hasChecked) {
                    checkViewStatus();
                }
            },
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        observer.observe(componentRef.current);

        // Listen for view status changes
        const handleJobViewed = (event) => {
            if (event.detail.jobId === jobId) {
                setIsViewed(event.detail.isViewed);
            }
        };

        window.addEventListener('jobViewed', handleJobViewed);

        return () => {
            observer.disconnect();
            window.removeEventListener('jobViewed', handleJobViewed);
        };
    }, [jobId, user, hasChecked]);

    return <div ref={componentRef}>{onViewStatusChange(isViewed)}</div>;
}
