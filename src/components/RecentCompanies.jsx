// components/RecentCompanies.js
import React from 'react';
import SkeletonCard from './SkeletonCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CircleAlert } from "lucide-react";

export default function RecentCompanies({ companies, loading, error }) {
    if (loading) return <div className="space-y-3"><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /><Skeleton className="w-full h-[20px] rounded-full" /></div>;
    if (error) return <p className="text-red-600">{error}</p>;
  if (companies.length === 0) return <p>No recently launched companies.</p>;

  if (!Array.isArray(companies)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No companies found.</p>
      </div>
    );
  }
  return (
    <div>
      {companies.map((company) => (
        <div key={company.id} className="mb-2">
          <p className="text-foreground font-medium">{company.name}</p>
        </div>
      ))}
    </div>
  );
}