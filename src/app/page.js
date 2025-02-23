"use client";
import ExampleJobPostings from "@/components/ExampleJobPostings";
import LastUpdated from "@/components/LastUpdated";
import TotalJobs from "@/components/total-jobs";
import IntroAccordion from "@/components/intro-accordion";
import "./styles.css"
import { useAuth } from '@/context/AuthContext';
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GlowEffect } from '@/components/ui/glow-effect';
import { ArrowRight } from "lucide-react";



export default function Home() {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  return (
    <div className="container py-10 px-6  mx-auto max-w-4xl w-full">
      <main className="space-y-4">
        <h1 className="text-2xl text-left font-semibold font-[family-name:var(--font-geist-sans)]">
          junera
        </h1>
        <div className="pb-10">
          <p className="text-left w-full text-sm text-muted-foreground font-[family-name:var(--font-geist-sans)]">
            A fast, focused job board for STEM professionals.
            Updated daily with new job postings.
            <LastUpdated />
          </p>
        </div>
        <section className="space-y-2 pb-10">
        <h3 className="text-left text-lg font-semibold font-[family-name:var(--font-geist-sans)]">
          Magic Reviews
        </h3>
        <p className="text-left pb-4 w-full text-sm text-muted-foreground font-[family-name:var(--font-geist-sans)]">
          Quickly get a review of your resume and see if applying is worth your time.
          </p>
        <video className="w-full rounded-xl border md:w-1/2 md:mx-auto" autoPlay loop muted playsInline>
          <source src="/job-fit.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        </section>

        <section className="space-y-2 pb-10">
        <h3 className="text-left text-lg font-semibold font-[family-name:var(--font-geist-sans)]">
          Agents
        </h3>
        <p className="text-left w-full pb-4 text-sm text-muted-foreground font-[family-name:var(--font-geist-sans)]">
          Deploy recruiter agents to scour millions of jobs writing personalized reviews for each one, and suggestions to improve.
          </p>
        <video className="w-full rounded-xl border md:w-1/2 md:mx-auto" autoPlay loop muted playsInline>
          <source src="/agent-tasks.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        </section>

        <section className="space-y-2 pb-10">
        <h3 className="text-left text-lg font-semibold font-[family-name:var(--font-geist-sans)]">
          Millions of job postings
        </h3>
        <p className="text-left w-full pb-4 text-sm text-muted-foreground font-[family-name:var(--font-geist-sans)]">
          Here are some example job postings to give you an idea of what&apos;s available.
          </p>
        <ExampleJobPostings />
        <TotalJobs />
        </section>
        <section className="space-y-2 pb-10 flex items-center justify-center">
          <div>
          <Link href="/job-postings">
          <div className='relative'>
      <GlowEffect
        colors={['#FF5733', '#33FF57', '#3357FF', '#F1C40F']}
        mode='colorShift'
        blur='soft'
        duration={3}
        scale={0.95}
      />
      <button className='relative inline-flex items-center gap-1 rounded-md bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-50 outline outline-1 outline-[#fff2f21f]'>
        View All Job Postings <ArrowRight className='h4 w-4' />
      </button>
    </div>
          </Link>
          </div>
        </section>

<section className="space-y-2">
<h3 className="text-left text-lg font-semibold font-[family-name:var(--font-geist-sans)]">
  Frequently Asked Questions
</h3>
<p className="text-left w-full pb-4 text-sm text-muted-foreground font-[family-name:var(--font-geist-sans)]">
  Here are some common questions about the website.
</p>
        <IntroAccordion />
</section>
      </main>
    </div>
  );
}
