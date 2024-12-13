'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function StickyNavbar({ title, companyName, companyLogo, companyId }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const titleElement = document.querySelector('[data-scroll-title]');
      if (!titleElement) return;
      const titlePosition = titleElement.getBoundingClientRect().top;
      setIsVisible(titlePosition < 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-background rounded-lg max-w-4xl mx-4 m-4 mt-2 border shadow-sm z-1000 py-1 px-4">
      <div className="container flex flex-col">
        <div className="flex flex-row w-full items-center">
          <Button variant="link" className="p-0 text-xs font-mono">
            <Avatar className="w-5 h-5 mr-1">
              <AvatarImage src={companyLogo} alt={companyName} />
              <AvatarFallback>{companyName?.[0]}</AvatarFallback>
            </Avatar>
            {companyName}
          </Button>
          <Button className="ml-auto" variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back To Top
          </Button>
        </div>
        <p className="text-sm font-mono">{title}</p>
      </div>
    </div>
  );
}