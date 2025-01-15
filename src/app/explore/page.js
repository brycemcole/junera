"use client";
import { JobCard } from "@/components/job-posting";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function JobPostingsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [title, setTitle] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [location, setLocation] = useState("");
    const limit = 2;
    const sentinelRef = useRef(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`/api/job-postings?page=${currentPage}&limit=${limit}&title=${title}&experienceLevel=${experienceLevel}&location=${location}`);
                const result = await response.json();
                setData((prevData) => [...prevData, ...result]);
            } catch (error) {
                console.error("Error fetching job postings:", error);
            }
        }
        fetchData();
    }, [currentPage, title, experienceLevel, location]);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setCurrentPage((prevPage) => prevPage + 1);
            }
        });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="container mx-auto py-10 p-4">
            <h1 className="text-2xl font-bold mb-4">Explore</h1>
            <div className="flex flex-col">
                {data.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
                <div ref={sentinelRef} style={{ height: 1 }} />
                <Button variant="outline">Explore more jobs</Button>
            </div>
        </div>
    );
}
