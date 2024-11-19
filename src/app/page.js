"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { RiFacebookFill, RiGithubFill, RiGoogleFill, RiTwitterXFill } from "@remixicon/react";

export function Button43() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="flex-1" variant="outline" aria-label="Login with Google" size="icon">
        <RiGoogleFill className="text-[#DB4437] dark:text-primary" size={16} aria-hidden="true" />
      </Button>
      <Button className="flex-1" variant="outline" aria-label="Login with Facebook" size="icon">
        <RiFacebookFill className="text-[#1877f2] dark:text-primary" size={16} aria-hidden="true" />
      </Button>
      <Button className="flex-1" variant="outline" aria-label="Login with X" size="icon">
        <RiTwitterXFill className="text-[#14171a] dark:text-primary" size={16} aria-hidden="true" />
      </Button>
      <Button className="flex-1" variant="outline" aria-label="Login with GitHub" size="icon">
        <RiGithubFill className="text-black dark:text-primary" size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}

export function Input21() {
  return (
    <div className="space-y-2">
      <Label htmlFor="input-21">Email</Label>
      <div className="flex rounded-lg shadow-sm shadow-black/5">
        <Input
          id="input-21"
          className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
          placeholder="Email"
          type="email"
        />
        <button className="inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm font-medium text-foreground ring-offset-background transition-shadow hover:bg-accent hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}

export function NotifyMe() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send email to backend
    console.log(email);
    setSubmitted(true);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="notify-me-email">Enter your email to be notified when we're back up:</Label>
      <form onSubmit={handleSubmit} className="flex rounded-lg shadow-sm shadow-black/5">
        <Input
          id="notify-me-email"
          className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm font-medium text-foreground ring-offset-background transition-shadow hover:bg-accent hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Notify Me
        </button>
      </form>
      {submitted && <p className="text-sm text-green-500">Thank you! We will notify you when we're back up.</p>}
    </div>
  );
}


export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Where's core?</AccordionTrigger>
        <AccordionContent>
          We're rewriting and renaming it to Junera.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Why rewrite?</AccordionTrigger>
        <AccordionContent>
          Old code was some sh*t. We're making it better.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What will be different?</AccordionTrigger>
        <AccordionContent>
          Speed, performance, and quicker shipping of features. 
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}


export function LoginButton() {
  return <Button className="w-full">Login</Button>;
}

export function Input31({ ...props }) {
  return (
    <div className="group relative w-full">
      <label
        htmlFor="input-31"
        className="absolute start-1 top-0 z-10 block -translate-y-1/2 bg-background px-2 text-xs font-medium text-foreground group-has-[:disabled]:opacity-50"
      >
        {props.text}
      </label>
      <Input id="input-31" className="h-10" placeholder={props.placeholder} />
    </div>
  );
}


export default function Home() {
  return (
    <div className="grid max-w-4xl mx-auto grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-center w-full">
        <a href="https://google.com">Hello and welcome!</a>
        <div className="flex gap-4 items-center flex-col sm:flex-col w-full">
          <NotifyMe />
          <AccordionDemo />
          <div>
          </div>
        </div>
      </main>
    </div>
  );
}
