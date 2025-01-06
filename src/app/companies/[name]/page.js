"use client";

import CompanyView from './company-view';
import { useParams, useSearchParams } from 'next/navigation';

export default function CompanyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    return <CompanyView companyName={params.name} page={parseInt(searchParams.get("page")) || 1} />;
}