"use client";
import React from "react";
import { useRouter } from "next/navigation";

export const TotalJobs = () => {
  const router = useRouter();
  const [data, setData] = React.useState([]);

    React.useEffect(() => {
        fetch("/api/job-postings/count")
            .then((res) => res.json())
            .then((data) => {
                if (data.count) {
                    setData(data.count);
                }
            })
            .catch((error) => console.error("Error fetching data:", error));
    }, [data]);

    if (!data) {
        return <>Last updated: today</>;
    }

    if (data.length === 0) {
        return <><br/>Last updated: today</>;
    }

    return (
        <>
        <p className="text-xs text-muted-foreground font-[family-name:var(--font-geist-sans)]">
           Apply to over {data} jobs today!
           </p>
        </>
    );
}

export default TotalJobs;