// components/SkeletonCard.js
import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="p-4 animate-pulse bg-gray-100 rounded">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  );
}