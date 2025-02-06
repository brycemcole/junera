"use client";
import ExampleJobPostings from "@/components/ExampleJobPostings";
import LastUpdated from "@/components/LastUpdated";
import TotalJobs from "@/components/total-jobs";
import IntroAccordion from "@/components/intro-accordion";
import "./styles.css"
import { useAuth } from '@/context/AuthContext';
import { redirect } from "next/navigation";


export default function Home() {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="container py-10 px-6  mx-auto max-w-4xl md:px-0 w-full">
      <main className="space-y-4">
        <h1 className="text-3xl text-left font-semibold font-[family-name:var(--font-geist-sans)]">
          junera
        </h1>
        <div className="pb-14">
          <p className="text-left w-full md:text-sm text-muted-foreground font-[family-name:var(--font-geist-sans)]">
            A fast, focused job board for STEM professionals.
            Updated daily with new job postings.
            <LastUpdated />

          </p>
        </div>
        <ExampleJobPostings />
        <TotalJobs />

        <IntroAccordion />
      </main>
    </div>
  );
}
