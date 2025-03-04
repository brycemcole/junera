'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function TrendingJobCards() {
  const [trending, setTrending] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchTrending = async () => {
      // Only start loading if component is visible in viewport
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && !isLoading && trending.length === 0) {
            loadTrending(signal);
          }
        }, { threshold: 0.1 });
        
        const element = document.getElementById('trending-container');
        if (element) observer.observe(element);
        
        return () => {
          if (element) observer.unobserve(element);
        };
      } else {
        // Fallback for browsers without IntersectionObserver
        loadTrending(signal);
      }
    };
    
    const loadTrending = async (signal) => {
      try {
        setIsLoading(true);
        // Update the API endpoint to the correct path
        const res = await fetch('/api/job-postings/trending', { 
          signal,
          headers: { 'Cache-Control': 'max-age=3600' }
        });
        if (res.ok) {
          const data = await res.json();
          setTrending(data.slice(0, 5)); // Limit to 5 items for better performance
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error('Error fetching trending jobs:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (trending.length === 0)
    fetchTrending();
    
    return () => {
      controller.abort();
    };
  }, []);

  const handleClick = (keyword) => {
    router.push(`/job-postings?title=${encodeURIComponent(keyword)}`);
  };

  return (
    <div id="trending-container" className="w-full flex gap-2 overflow-x-auto py-2">
      {isLoading ? (
        // Skeleton loading state
        Array(3).fill().map((_, i) => (
          <div key={i} className="min-w-[120px] h-8 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
        ))
      ) : trending.length > 0 ? (
        trending.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
            onClick={() => handleClick(item.keyword)}
          >
            {item.keyword}
            {item.trend > 0 && <Badge variant="outline" className="ml-2 text-green-500">↑</Badge>}
          </Button>
        ))
      ) : null}
    </div>
  );
}
