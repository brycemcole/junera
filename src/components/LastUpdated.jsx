"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Assuming Avatar components are defined/imported
import { Badge } from "@/components/ui/badge"; 
import { MapPin, Briefcase, Calendar, DollarSign } from "lucide-react"; // Assuming you are using react-icons
import { formatDistanceToNow } from "date-fns";

export const LastUpdated = () => {
  const router = useRouter();
  const [data, setData] = React.useState([]);

    React.useEffect(() => {
        fetch("/api/job-postings")
            .then((res) => res.json())
            .then((data) => {
                if (data.jobPostings && data.jobPostings.length > 0) {
                    setData(data.jobPostings[0].postedDate);
                }
            })
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    if (!data) {
        return <>Last updated: today</>;
    }

    if (data.length === 0) {
        return <><br/>Last updated: today</>;
    }

    return (
        <><br/>
            Last updated: {formatDistanceToNow(data)} ago
        </>
    );
}

export default LastUpdated;