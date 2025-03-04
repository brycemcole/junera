import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Map, Loader2 } from "lucide-react";

const LocationSearch = ({ location, setLocation, loading }) => {
  const [searchValue, setSearchValue] = useState(location || "");
  const [timer, setTimer] = useState(null);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);

    // Clear existing timeout
    if (timer) {
      clearTimeout(timer);
    }

    // If empty, clear immediately
    if (!newValue) {
      setLocation("");
      return;
    }

    // Set new timeout for search
    const newTimer = setTimeout(() => {
      setLocation(newValue);
    }, 800);
    setTimer(newTimer);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (timer) {
        clearTimeout(timer);
      }
      setLocation(searchValue);
    }
  };

  // Update local state immediately when prop changes
  useEffect(() => {
    setSearchValue(location || "");
  }, [location]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return (
    <div className="relative">
      <Input
        id="location-search"
        className="peer pr-24 z-1 ps-9 h-11 rounded-xl text-[16px]"
        placeholder="Search for a location"
        type="search"
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-0 flex items-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Map size={16} strokeWidth={2} />
        )}
      </div>
    </div>
  );
};