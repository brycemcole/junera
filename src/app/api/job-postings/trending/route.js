import { query } from "@/lib/pgdb";
import { setCached, getCached } from "@/lib/cache";
import { NextResponse } from 'next/server';

// Cache the trending results for 1 hour
export const revalidate = 3600;

const JOB_CATEGORIES = {
  'Software Engineer': [
    'Software Engineer',
    'Software Developer',
    'Full Stack Engineer',
    'Backend Engineer',
    'Frontend Engineer'
  ],
  'Product Manager': [
    'Product Manager',
    'Technical Product Manager',
    'Senior Product Manager',
    'Product Owner'
  ],
  'Data Analyst': [
    'Data Analyst',
    'Business Analyst',
    'Data Scientist',
    'Analytics Engineer'
  ],
  'Legal': [
    'Attorney',
    'Lawyer',
    'Legal Counsel',
    'Corporate Counsel'
  ]
};

// Sample trending data - in a real app, this would come from a database
const trendingKeywords = [
  { keyword: "Software Engineer", count: 2500, trend: 1.2 },
  { keyword: "Data Scientist", count: 1800, trend: 0.8 },
  { keyword: "Product Manager", count: 1500, trend: 1.5 },
  { keyword: "DevOps", count: 1200, trend: 2.1 },
  { keyword: "UX Designer", count: 1000, trend: 0.9 },
  { keyword: "Machine Learning", count: 950, trend: 1.7 },
  { keyword: "Frontend Developer", count: 900, trend: 0.7 },
  { keyword: "Full Stack", count: 850, trend: 1.3 },
  { keyword: "Backend Engineer", count: 800, trend: 0.6 },
  { keyword: "Cloud Engineer", count: 750, trend: 1.4 }
];

export async function GET(request) {
  try {
    // Add a small artificial delay to simulate database query (remove in production)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return trending keywords with HTTP cache headers
    return NextResponse.json(trendingKeywords, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching trending keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending keywords' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';