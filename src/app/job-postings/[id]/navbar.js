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
    <></>
  );
}