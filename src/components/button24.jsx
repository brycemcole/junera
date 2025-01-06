"use client";

import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from '@/hooks/use-toast';

export default function Button24({ jobId }) {
    const [bookmarked, setBookmarked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const checkBookmarkStatus = async () => {
            if (!jobId) return;
            if (!user) return;
            if (!user?.token) return;
            
            try {
                const response = await fetch(`/api/bookmarks?jobId=${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                const data = await response.json();
                setBookmarked(data.isBookmarked);
            } catch (error) {
                console.error('Error checking bookmark status:', error);
            }
        };

        checkBookmarkStatus();
    }, [jobId, user?.token, user]);

    const handleToggle = async (pressed) => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please login to bookmark jobs",
                variant: "destructive"
            });
            return;
        }
        if (!user?.token) {
            toast({
                title: "Authentication required",
                description: "Please login to bookmark jobs",
                variant: "destructive"
            });
            return;
        }

        const isAddingBookmark = !bookmarked;  // Determine action based on current state
        
        try {
            const response = await fetch(
                isAddingBookmark ? '/api/bookmarks' : `/api/bookmarks?jobPostingId=${jobId}`,
                {
                    method: isAddingBookmark ? 'POST' : 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                    },
                    ...(isAddingBookmark && { 
                        body: JSON.stringify({ jobPostingId: jobId }) 
                    })
                }
            );

            if (response.ok) {
                setBookmarked(isAddingBookmark);
                toast({
                    title: isAddingBookmark ? "Bookmark added" : "Bookmark removed",
                    variant: "default"
                });
            }
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "Failed to update bookmark",
                variant: "destructive"
            });
        }
    };

    const handleClick = (e) => {
        // Prevent the click event from propagating to parent elements
        e.stopPropagation();
    };

    if (!user) return null;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="text-foreground"
                    >
                        <Toggle
                            className="group size-9 border rounded-lg shadow-sm hover:bg-green-500/10 hover:text-green-600 data-[state=on]:border-green-500/20 data-[state=on]:bg-green-500/10 data-[state=on]:text-green-600 dark:data-[state=on]:bg-green-500/10 dark:data-[state=on]:text-green-500"
                            aria-label="Bookmark this"
                            pressed={bookmarked || isHovered}
                            onPressedChange={handleToggle}
                            onClick={handleClick}  // Add this line
                        >
                            <Bookmark 
                                size={16} 
                                strokeWidth={2} 
                                aria-hidden="true"
                                className={isHovered ? "fill-current " : bookmarked ? "fill-current" : ""}
                            />
                        </Toggle>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="border border-input bg-popover px-2 py-1 text-xs text-muted-foreground">
                    <p>{bookmarked ? "Remove bookmark" : "Bookmark this"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
