'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import ProfileContent from '@/components/profile/profile-content';
import { useAuth } from '@/context/AuthContext';
import { LoaderIcon, CircleAlert } from 'lucide-react';
import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns';

// Add these utility functions
const formatStartDate = (date) => format(new Date(date), 'MMMM yyyy');
const calculateDuration = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : new Date();
    const years = differenceInYears(end, start);
    const months = differenceInMonths(end, start) % 12;
    // ...rest of calculateDuration logic...
};

export default function PublicProfilePage({ params }) {
    const { user } = useAuth();
    const { profile, loading, error } = useProfile(params.username);
    const [isFollowing, setIsFollowing] = useState(false);

    if (loading) {
        return (
            <div className="container mx-auto py-10 px-4 text-center">
                <LoaderIcon className="mx-auto h-8 w-8 animate-spin" />
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-10 px-4 text-center">
                <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-xl font-semibold">Profile not found</h2>
                <p className="mt-2 text-muted-foreground">The requested profile could not be found.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-0 px-6 max-w-4xl">
            <ProfileContent
                profile={profile}
                onFollow={() => {/* handle follow */}}
                isFollowing={isFollowing}
                user={user}
                currentUsername={params.username}
            />
        </div>
    );
}
