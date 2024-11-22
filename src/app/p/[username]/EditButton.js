"use client";
import { useAuth } from '@/context/AuthContext';

export default function EditButton({ profileId }) {
  const { user } = useAuth();

  if (user && user.id === profileId) {
    return <a href="/edit-profile" className="ml-4 text-blue-500">Edit</a>;
  }

  return null;
}