"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { loginAction } from '@/app/actions/auth';
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CircleAlert, Eye, Lock, User2, Github } from "lucide-react";

const FormSchema = z.object({
  emailOrUsername: z.string().min(1, {
    message: "Please enter your email or username.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

function InputForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  })

  async function onSubmit(data) {
    setStatusMessage({ text: '', isError: false });

    try {
      const result = await loginAction(data);

      if (result.error) {
        setStatusMessage({ text: result.error, isError: true });
        return;
      }

      if (result.token) {
        await login(result.token, result.username, result.id, result.fullName, result.avatar, result.jobPrefsTitle, result.jobPrefsLocation, result.jobPrefsLevel);
        setStatusMessage({ text: 'Logged in successfully. Welcome back!', isError: false });
        router.refresh(); // Force a refresh of the router
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatusMessage({ text: 'An error occurred during login', isError: true });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {statusMessage.text && (
          <div className={`rounded-lg border px-4 py-3 ${statusMessage.isError
            ? 'border-red-500/50 bg-red-600/20 text-red-600'
            : 'border-green-500/50 text-green-600'
            }`}>
            <p className="text-sm">
              <CircleAlert
                className="-mt-0.5 me-3 inline-flex opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              {statusMessage.text}
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="emailOrUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email / Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <User2 size={12} className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="email or username" autoComplete="username" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock size={12} className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9 pr-9" type="password" placeholder="password" autoComplete="current-password" {...field} />
                  <Button variant="ghost" size="smicon" className="absolute top-1/2 right-3 transform -translate-y-1/2" type="button" onClick={() => {
                    const input = document.querySelector('input[name="password"]');
                    input.type = input.type === 'password' ? 'text' : 'password';
                  }
                  }>
                    <Eye size={14} className="text-muted-foreground" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full font-semibold bg-green-500/20 border border-green-600/30 text-green-700 shadow-md hover:text-primary hover:bg-green-500/30" type="submit">Login</Button>
      </form>
    </Form>
  )
}


export default function Login() {
  const { user } = useAuth();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }

    // Check for GitHub auth error
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    if (error === 'github_auth_failed') {
      setStatusMessage({
        text: 'GitHub authentication failed. Please try again or use another login method.',
        isError: true
      });
    }
  }, [user, router]);

  const handleGitHubLogin = (mode = 'login') => {
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const userId = user?.id; // Get current user ID if available
    
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: 'https://dev.junera.us/api/login/github',
    });

    if (mode === 'link' && userId) {
      params.append('mode', 'link');
      params.append('userId', userId);
    }

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  return (
    <div className="flex justify-center p-4 sm:p-8">
      <main className="flex flex-col gap-8 my-48 mt-24 w-full max-w-[60%] sm:max-w-sm">
        {statusMessage.text && (
          <div className={`rounded-lg border px-4 py-3 ${statusMessage.isError
            ? 'border-red-500/50 bg-red-600/20 text-red-600'
            : 'border-green-500/50 text-green-600'
            }`}>
            <p className="text-sm">
              <CircleAlert
                className="-mt-0.5 me-3 inline-flex opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              {statusMessage.text}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium">Login</h1>
          <p className="text-muted-foreground text-sm">
            Don&apos;t have an account? <Link href="/register" className="text-primary">Register</Link>
          </p>
        </div>
        <InputForm />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubLogin}
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </main>
    </div>
  );
}
