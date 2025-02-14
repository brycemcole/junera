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

                const headers = {
                    'Content-Type': 'application/json',
                };

                // Add authorization header if user is logged in
                if (user?.token) {
                    headers['Authorization'] = `Bearer ${user.token}`;
                }

                const response = await fetch(`/api/users/${username}`, {
                    headers,
                    signal: controller.signal
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch profile');
                }
                
                const data = await response.json();
                if (isActive) {
                    setProfile(data);
                    setError(null);
                }
            } catch (err) {
                if (isActive && err.name !== 'AbortError') {
                    console.error('Profile fetch error:', err);
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
    }, [username, user?.username, user?.token, router]);

    return { profile, loading, error };
}
