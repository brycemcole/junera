'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export default function ViewStatus({ jobId, showAlways = false }) {
  const [isViewed, setIsViewed] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const componentRef = useRef(null);

  const checkViewStatus = async () => {
    try {
      const response = await fetch(`/api/job-postings/${jobId}/view-status`);
      const data = await response.json();
      setIsViewed(data.isViewed);
    } catch (error) {
      console.error('Error checking view status:', error);
    }
  };

  useEffect(() => {
    if (showAlways) {
      checkViewStatus();
      return;
    }

    if (!componentRef.current || hasChecked) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasChecked) {
          setHasChecked(true);
          await checkViewStatus();
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
  }, [jobId, hasChecked, showAlways]);

  if (!isViewed) return null;

  return (
    <div ref={componentRef}>
      <Badge variant="secondary" className="gap-1">
        <Eye className="h-3 w-3" />
        Viewed
      </Badge>
    </div>
  );
}
