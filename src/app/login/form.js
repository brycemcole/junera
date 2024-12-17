"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from 'next/navigation';
import { z } from "zod";
import { Button } from "@/components/ui/button"
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext'; 
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const loginFormSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
});

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth(); // Destructure login from AuthContext
  const [errorMessage, setErrorMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await axios.get('/api/csrf-token');
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token', error);
      }
    }
    fetchCsrfToken();
  }, []);

  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values, event) {
    event.preventDefault();
    try {
      const response = await axios.post('/api/login', values, {
        headers: {
          'CSRF-Token': csrfToken,
          'Cloudflare-Token': '{YOURTOKENHERE}',
        },
      });
      if (response.data.token) {
        login(response.data.token); // Use AuthContext's login function
        router.push('/dashboard');
      } else {
        setErrorMessage('Unexpected response from server.');
      }
    } catch (error) {
      console.error('Login failed', error);
      setErrorMessage(error.response?.data?.error || 'Login failed. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
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
                <Input type="password" placeholder="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage && <div className="text-red-500">{errorMessage}</div>}
        <Button className="w-full" type="submit">Login</Button>
      </form>
    </Form>
  );
}

