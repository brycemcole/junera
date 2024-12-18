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
    <div
      className={`
        fixed md:top-4 top-0 left-1/2 
        transform -translate-x-1/2 
        w-full max-w-4xl 
        md:mt-2 
        py-2 px-4 
        z-50 
        md:border 
        md:rounded-lg 
        shadow-sm 
        bg-white dark:bg-black dark:bg-opacity-10 bg-opacity-30 
        backdrop-blur-lg 
        transition 
        duration-300 
        ease-in-out 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
      `}
    >
      <div className="container flex flex-col">
        <div className="flex flex-row w-full items-center">
          <Button variant="link" className="p-0 text-xs font-mono" onClick={() => window.location.href = `/companies/${companyId}`}>
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
        <p className="text-md font-semibold">{title}</p>
      </div>
    </div>
  );
}