"use client";
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import LoginForm from "./form";
import Button44 from "./login-buttons";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export default function Login() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8">
      <main className="flex flex-col gap-8 items-center w-full max-w-md sm:max-w-lg">
        <div className="w-full p-4 sm:p-8">
          <div className="mb-16">
          <Button44 />
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
