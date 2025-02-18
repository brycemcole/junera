"use client";
import { useEffect } from 'react';
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
import { CircleAlert, Github } from "lucide-react";
import { useState } from "react";

const FormSchema = z.object({
  fullname: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }).max(20, {
    message: "Username must be less than 20 characters.",
  }).regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain letters, numbers, underscores, and hyphens.",
  }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
})

const FormFieldComponent = ({ name, label, type = "text", description = "", form }) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              className={form.formState.errors[name] && 
                "border-destructive/50 text-destructive focus-visible:ring-destructive/20"}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

function InputForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });
  const [githubData, setGithubData] = useState(null);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullname: "",
      email: "",
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    // Check for GitHub data in URL
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('github_data');
    if (encodedData) {
      try {
        const decoded = JSON.parse(atob(encodedData));
        setGithubData(decoded);
        form.reset({
          fullname: decoded.full_name,
          email: decoded.email,
          username: decoded.username,
        });
      } catch (error) {
        console.error('Error parsing GitHub data:', error);
      }
    }
  }, []);

  async function onSubmit(data) {
    setStatusMessage({ text: '', isError: false });

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add GitHub data if available
      if (githubData) {
        formData.append('github_id', githubData.github_id);
        formData.append('github_user', githubData.username);
        formData.append('avatar_url', githubData.avatar_url);
      }

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
        router.push('/dashboard');
      }
    } catch (error) {
      setStatusMessage({
        text: 'An error occurred during registration. Please try again.',
        isError: true
      });
    }
  }

  const handleGitHubLogin = () => {
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=https://dev.junera.us/api/login/github`;
  };

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

        <FormFieldComponent
          name="fullname"
          label="Full Name"
          description="This is your public display name."
          form={form}
        />

        <FormFieldComponent
          name="email"
          label="Email"
          type="email"
          form={form}
        />

        <FormFieldComponent
          name="username"
          label="Username"
          description="You cannot change this later."
          form={form}
        />

        <FormFieldComponent
          name="password"
          label="Password"
          type="password"
          form={form}
        />

        <Button
          className="w-full font-semibold bg-green-500/20 border border-green-600/30 text-green-700 shadow-md hover:text-primary hover:bg-green-500/30"
          type="submit"
        >
          Create Account
        </Button>

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
      </form>
    </Form>
  )
}

export default function Register() {
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
