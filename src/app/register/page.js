"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { registerAction } from '@/app/actions/auth';
import { Button } from "@/components/ui/button"
import Link from "next/link";
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
import { CircleAlert } from "lucide-react";

const FormSchema = z.object({
  fullname: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

function InputForm() {
  const { login } = useAuth();
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullname: "",
      email: "",
      username: "",
      password: "",
    },
  })

  async function onSubmit(data) {
    setStatusMessage({ text: '', isError: false });
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await registerAction(formData);

    if (result.error) {
      setStatusMessage({ text: result.error, isError: true });
      return;
    }

    if (result.token) {
      localStorage.setItem('token', result.token);
      login(result.token, result.username, result.userId);
      setStatusMessage({ text: 'Account created successfully. Welcome to Junera!', isError: false });
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {statusMessage.text && (
          <div className={`rounded-lg border px-4 py-3 ${statusMessage.isError
            ? 'border-red-500/50 text-red-600'
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
          name="fullname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="full name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                You cannot change this later.
              </FormDescription>
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
        <Button className="w-full font-semibold bg-green-500/20 border border-green-600/30 text-green-700 shadow-md hover:text-primary hover:bg-green-500/30" type="submit">Create Account</Button>
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
    <div className="flex justify-center p-4 sm:p-8">
      <main className="flex flex-col gap-8 my-48 mt-24 w-full max-w-[60%] sm:max-w-sm">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium">Register</h1>
          <p className="text-muted-foreground text-sm">
            Already have an account? <Link href="/login" className="text-primary">Login</Link>

          </p>
        </div>

        <InputForm />
      </main>
    </div>
  );
}
