"use client";
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button"
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

const FormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

function InputForm() {
  const { toast } = useToast();
  const { login } = useAuth();
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(data) {
    console.log("data: ", data);
    // Send data to the server
    fetch(`/api/login?${new URLSearchParams(data).toString()}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("data: ", data);
        if (data.token) {
          localStorage.setItem('token', data.token); // Store token in localStorage
          login(data.token, data.username, data.userId, data.avatar); // Update user context
          toast({ title: "Logged in successfully", description: "Welcome back!" });
        } else {
          toast({ title: "Failed to log in", description: "Please check your email and password" });
        }
      })
      .catch((error) => {
        console.error("Error creating account:", error);
        toast("Failed to create account");
      });

    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="  space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email" {...field} />
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}


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
      <main className="flex flex-col gap-8 w-full max-w-xs sm:max-w-lg">
        <InputForm />
      </main>
    </div>
  );
}
