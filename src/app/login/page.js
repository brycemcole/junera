"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { loginAction } from '@/app/actions/auth';
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
import { CircleAlert } from "lucide-react";

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
      const result = await loginAction({
        emailOrUsername: data.emailOrUsername,
        password: data.password
      });

      if (result.error) {
        setStatusMessage({ text: result.error, isError: true });
        return;
      }

      if (result.token) {
        localStorage.setItem('token', result.token);
        await login(result.token); // Wait for login to complete
        setStatusMessage({ text: 'Logged in successfully. Welcome back!', isError: false });
        form.reset();
        setTimeout(() => {
          router.push('/dashboard');
        }, 500); // Give time for the success message to show
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
          name="emailOrUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email or Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter email or username" {...field} />
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
        <Button className="w-full font-semibold hover:text-primary hover:bg-accent" type="submit">Login</Button>
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
        <InputForm />
      </main>
    </div>
  );
}
