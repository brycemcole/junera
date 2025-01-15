"use client";
import { JobCard } from "@/components/job-posting";
import { useState, useEffect } from "react";
import {Button} from "@/components/ui/button";

export default function JobPostingsPage() {
    const [currentPage] = useState(1);
    const [data, setData] = useState([]);
    const [title, setTitle] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [location, setLocation] = useState("");
    const limit = 2;

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`/api/job-postings?page=${currentPage}&limit=${limit}&title=${title}&experienceLevel=${experienceLevel}&location=${location}`);
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Error fetching job postings:", error);
            }
        }
        fetchData();
    }, [currentPage, title, experienceLevel, location]);
    

  return (
    <div className="container mx-auto py-10 p-4">
            <h1 className="text-2xl font-bold mb-4">Explore</h1>
            <div className="flex flex-col">
            {data.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
                <Button variant="outline">Explore more jobs</Button>
                </div>
    </div>
  );
}
