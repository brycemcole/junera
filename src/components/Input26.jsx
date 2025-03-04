import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

const Input26 = ({ onSearch, value, loading }) => {
  const [searchValue, setSearchValue] = useState(value || "");
  const isFirstRender = useRef(true);
  const searchTimeout = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      onSearch(searchValue);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // If empty, search immediately
    if (newValue === "") {
      onSearch("");
      return;
    }

    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      onSearch(newValue);
    }, 800);
  };

  // Update search value immediately when value prop changes
  useEffect(() => {
    setSearchValue(value || "");
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Input
        id="input-26"
        className="peer pr-24 z-1 ps-9 h-11 rounded-xl shadow shadow-md text-[16px]"
        placeholder="Search for a job title"
        onKeyDown={handleKeyDown}
        type="search"
        value={searchValue}
        onChange={handleInputChange}
      />
      <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-0 flex items-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Search size={16} strokeWidth={2} />
        )}
      </div>
    </div>
  );
};