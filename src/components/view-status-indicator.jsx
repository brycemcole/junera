"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ViewStatusIndicator({ jobId, onViewStatusChange }) {
    const [status, setStatus] = useState({ isViewed: false, viewedAt: null });
    const [hasChecked, setHasChecked] = useState(false);
    const componentRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!componentRef.current || hasChecked || !jobId || !user?.token) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasChecked) {
                    setHasChecked(true);
                    fetch(`/api/job-postings/${jobId}/view-status`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        setStatus({
                            isViewed: data.isViewed,
                            viewedAt: data.viewedAt
                        });
                    })
                    .catch(error => {
                        console.error('Error checking view status:', error);
                    });
                }
            },
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        observer.observe(componentRef.current);
        return () => observer.disconnect();
    }, [jobId, user?.token, hasChecked]);

    return (
        <div ref={componentRef}>
            {onViewStatusChange && onViewStatusChange(status.isViewed, status.viewedAt)}
        </div>
    );
}
