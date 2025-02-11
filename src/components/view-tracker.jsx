"use client";

import { useState, useEffect, useRef } from "react";
import { trackJobView } from "@/app/actions/trackJobView";

export default function ViewTracker({ jobId }) {
    const [hasTracked, setHasTracked] = useState(false);
    const componentRef = useRef(null);

    useEffect(() => {
        if (!componentRef.current || hasTracked || !jobId) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !hasTracked) {
                    setHasTracked(true);
                    try {
                        await trackJobView(jobId);
                    } catch (error) {
                        console.error('Error tracking job view:', error);
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

        return () => {
            observer.disconnect();
        };
    }, [jobId, hasTracked]);

    return <div ref={componentRef} className="hidden" />;
}
