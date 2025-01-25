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
import { CircleAlert, Loader2 } from "lucide-react";
import { useId } from "react";
import { useDebounce } from 'use-debounce';

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

function InputForm() {
  const { login } = useAuth();
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });
  const [validating, setValidating] = useState({
    fullname: false,
    email: false,
    username: false,
    password: false
  });
  const [fieldErrors, setFieldErrors] = useState({
    fullname: '',
    email: '',
    username: '',
    password: ''
  });

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullname: "",
      email: "",
      username: "",
      password: "",
    },
    mode: "onChange"
  });

  // Watch form values for real-time validation
  const fullname = form.watch("fullname");
  const email = form.watch("email");
  const username = form.watch("username");
  const password = form.watch("password");

  // Debounce the values
  const [debouncedFullname] = useDebounce(fullname, 500);
  const [debouncedEmail] = useDebounce(email, 500);
  const [debouncedUsername] = useDebounce(username, 500);
  const [debouncedPassword] = useDebounce(password, 500);

  // Validate fields on debounced value changes
  useEffect(() => {
    if (!debouncedFullname) {
      setFieldErrors(prev => ({ ...prev, fullname: '' }));
      return;
    }
    setValidating(prev => ({ ...prev, fullname: true }));
    try {
      FormSchema.shape.fullname.parse(debouncedFullname);
      setFieldErrors(prev => ({ ...prev, fullname: '' }));
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, fullname: error.errors[0].message }));
    }
    setValidating(prev => ({ ...prev, fullname: false }));
  }, [debouncedFullname]);

  // Similar validation effects for email, username, and password...
  useEffect(() => {
    if (!debouncedEmail) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
      return;
    }
    setValidating(prev => ({ ...prev, email: true }));
    try {
      FormSchema.shape.email.parse(debouncedEmail);
      setFieldErrors(prev => ({ ...prev, email: '' }));
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, email: error.errors[0].message }));
    }
    setValidating(prev => ({ ...prev, email: false }));
  }, [debouncedEmail]);

  // Similar for username and password...

  useEffect(() => {
    if (!debouncedUsername) {
      setFieldErrors(prev => ({ ...prev, username: '' }));
      return;
    }
    setValidating(prev => ({ ...prev, username: true }));
    try {
      FormSchema.shape.username.parse(debouncedUsername);
      setFieldErrors(prev => ({ ...prev, username: '' }));
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, username: error.errors[0].message }));
    }
    setValidating(prev => ({ ...prev, username: false }));
  }, [debouncedUsername]);

  useEffect(() => {
    if (!debouncedPassword) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
      return;
    }
    setValidating(prev => ({ ...prev, password: true }));
    try {
      FormSchema.shape.password.parse(debouncedPassword);
      setFieldErrors(prev => ({ ...prev, password: '' }));
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, password: error.errors[0].message }));
    }
    setValidating(prev => ({ ...prev, password: false }));
  }, [debouncedPassword]);

  async function onSubmit(data) {
    setStatusMessage({ text: '', isError: false });

    try {
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
    } catch (error) {
      setStatusMessage({
        text: 'An error occurred during registration. Please try again.',
        isError: true
      });
    }
  }

  const renderFormField = (name, label, type = "text", description = "") => {
    const id = useId();
    const error = fieldErrors[name];
    const isValidating = validating[name];

    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor={id}>{label}</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  id={id}
                  type={type}
                  className={error && "border-destructive/50 text-destructive focus-visible:ring-destructive/20"}
                  {...field}
                />
              </FormControl>
              {isValidating && (
                <div className="absolute right-2 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" />
                </div>
              )}
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            {error && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {error}
              </p>
            )}
          </FormItem>
        )}
      />
    );
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

        {renderFormField(
          "fullname",
          "Full Name",
          "text",
          "This is your public display name."
        )}

        {renderFormField("email", "Email")}

        {renderFormField(
          "username",
          "Username",
          "text",
          "You cannot change this later."
        )}

        {renderFormField("password", "Password", "password")}

        <Button
          className="w-full font-semibold bg-green-500/20 border border-green-600/30 text-green-700 shadow-md hover:text-primary hover:bg-green-500/30"
          type="submit"
          disabled={Object.values(fieldErrors).some(error => error)}
        >
          Create Account
        </Button>
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
