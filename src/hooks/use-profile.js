import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useProfile(username) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;

        async function fetchProfile() {
            if (!username) return;

            try {
                setLoading(true);
                // Redirect if viewing own profile
                if (user?.username === username) {
                    router.push('/profile');
                    return;
                }

                const response = await fetch(`/api/users/${username}`, {
                    signal: controller.signal
                });
                
                if (!response.ok) throw new Error('Failed to fetch profile');
                
                const data = await response.json();
                if (isActive) {
                    setProfile(data);
                    setError(null);
                }
            } catch (err) {
                if (isActive && err.name !== 'AbortError') {
                    setError(err.message);
                }
            } finally {
                if (isActive) setLoading(false);
            }
        }

        fetchProfile();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [username, user?.username, router]);

    return { profile, loading, error };
}
