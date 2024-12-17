"use client";
import ExampleJobPostings from "@/components/ExampleJobPostings";
import LastUpdated from "@/components/LastUpdated";
import "./styles.css"
import { useAuth } from '@/context/AuthContext';


export default function Home() {
  const { user, loading } = useAuth();
  return (
    <div className="container py-20 px-4 mx-auto max-w-4xl md:px-0 w-full">
      <main className="space-y-4 items-center">
        <h1 className="text-3xl text-center dark:text-neutral-200 font-mono">
          junera
        </h1>
        <p className="text-center w-full mx-auto sm:max-w-sm dark:text-neutral-300 md:text-lg">
          A fast, focused job board for STEM professionals.
          Updated daily with new job postings.
          <LastUpdated />

        </p>
        <br />
        <br />
        <ExampleJobPostings />
      </main>
    </div>
  );
}
