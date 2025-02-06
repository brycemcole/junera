'use client';

import { memo, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";

const SuggestedUsers = memo(({ currentUsername }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSuggestedUsers() {
            try {
                const response = await fetch('/api/users/suggested');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users.filter(u => u.username !== currentUsername));
                }
            } catch (error) {
                console.error('Error fetching suggested users:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSuggestedUsers();
    }, [currentUsername]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {users.map(user => (
                <Link
                    href={`/profile/${user.username}`}
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.headline || `@${user.username}`}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
});

SuggestedUsers.displayName = 'SuggestedUsers';
export default SuggestedUsers;
