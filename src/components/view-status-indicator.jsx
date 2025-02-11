"use client";

import { useState, useEffect, useRef } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ViewStatusIndicator({ jobId }) {
    const [isViewed, setIsViewed] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const componentRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!componentRef.current || hasChecked || !jobId || !user || !user?.token) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !hasChecked) {
                    setHasChecked(true);
                    try {
                        const response = await fetch(`/api/job-postings/${jobId}/view-status`, {
                            headers: {
                                'Authorization': `Bearer ${user.token}`
                            }
                        });
                        const data = await response.json();
                        console.log('View status response:', data);
                        setIsViewed(data.isViewed);
                    } catch (error) {
                        console.error('Error checking view status:', error);
                    }
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
    }, [jobId, user?.token, user, hasChecked]);

    if (!user) return null;

    return (
        <div ref={componentRef}>
            {isViewed && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1 border-blue-500/20 bg-blue-500/10 text-blue-600">
                                <Eye className="w-3 h-3" />
                                <span>Viewed</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="border border-input bg-popover px-2 py-1 text-xs text-muted-foreground">
                            <p>You've viewed this job</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}
