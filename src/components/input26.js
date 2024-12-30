'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SparkleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Input26({ onSearch, value, userPreferredTitle = "", applyJobPrefs }) {
  const [searchValue, setSearchValue] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setLoading(true);
      try {
        await Promise.resolve(onSearch(searchValue));
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);

    // If the search value is empty, trigger the search immediately
    if (newValue === "") {
      onSearch("");
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (searchValue.trim() === "") {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        await Promise.resolve(onSearch(searchValue));
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  useEffect(() => {
    setSearchValue(value || "");
  }, [value]);

  return (
    <div className="space-y-2 mb-2">
      <div className="relative">
        <Input
          id="input-26"
          className="peer pr-24 z-1 ps-9 h-12 rounded-xl text-[16px]"
          placeholder={userPreferredTitle && applyJobPrefs ? `Showing jobs for ${userPreferredTitle}` : "Search for a job title"}
          onKeyDown={handleKeyDown}
          type="search"
          value={searchValue}
          onChange={handleInputChange}
          disabled={loading}
        />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-0 flex items-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          {loading ? (
            <span className="animate-spin">⌛</span>
          ) : (
            <Search size={16} strokeWidth={2} />
          )}
        </div>
      </div>
    </div>
  );
}
