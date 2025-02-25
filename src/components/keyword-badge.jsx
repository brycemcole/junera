import React from 'react';
import Link from 'next/link';

const KeywordBadge = ({ 
  keyword, 
  clickable = false, 
  colorScheme = 'blue',
  className = '',
  onClick
}) => {
  // Color scheme mapping
  const colorSchemes = {
    blue: "bg-blue-400/30 text-blue-700 dark:text-blue-300 border border-blue-600/50 shadow-blue-500/10",
    green: "bg-green-400/30 text-green-700 dark:text-green-300 border border-green-600/50 shadow-green-500/10",
    red: "bg-red-400/30 text-red-700 dark:text-red-300 border border-red-600/50 shadow-red-500/10",
    yellow: "bg-yellow-400/30 text-yellow-700 dark:text-yellow-300 border border-yellow-600/50 shadow-yellow-500/10",
    purple: "bg-purple-400/30 text-purple-700 dark:text-purple-300 border border-purple-600/50 shadow-purple-500/10",
    gray: "bg-gray-400/30 text-gray-700 dark:text-gray-300 border border-gray-600/50 shadow-gray-500/10"
  };

  // Base classes
  const baseClasses = `inline-flex items-center px-2 py-0.5 rounded-md shadow text-xs font-medium ${colorSchemes[colorScheme] || colorSchemes.blue}`;
  
  // Add hover effect when clickable
  const classes = clickable 
    ? `${baseClasses} hover:bg-${colorScheme}-500/40 transition-colors cursor-pointer ${className}`
    : `${baseClasses} ${className}`;

  if (clickable) {
    return (
      <Link href={`/job-postings?keywords=${encodeURIComponent(keyword)}`}>
        <span className={classes} onClick={onClick}>
          {keyword}
        </span>
      </Link>
    );
  }

  return (
    <span className={classes}>
      {keyword}
    </span>
  );
};

export default KeywordBadge;
