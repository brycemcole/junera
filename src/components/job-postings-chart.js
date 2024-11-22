"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    postings: {
        label: "Job Postings",
        color: "hsl(var(--chart-1))",
    },
}

export function JobPostingsChart({ title, experienceLevel, location, company }) {
    const [chartData, setChartData] = useState([])
    const [trend, setTrend] = useState({ percentage: 0, isUp: true })

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await fetch(
                    `/api/job-postings/monthly-stats?title=${encodeURIComponent(
                        title || ""
                    )}&experienceLevel=${encodeURIComponent(
                        experienceLevel || ""
                    )}&location=${encodeURIComponent(
                        location || ""
                    )}&company=${encodeURIComponent(company || "")}`
                )
                const data = await response.json()
                setChartData(data.monthlyStats)
                
                // Calculate trend
                if (data.monthlyStats.length >= 2) {
                    const lastMonth = data.monthlyStats[data.monthlyStats.length - 1].count
                    const previousMonth = data.monthlyStats[data.monthlyStats.length - 2].count
                    const percentageChange = ((lastMonth - previousMonth) / previousMonth) * 100
                    setTrend({
                        percentage: Math.abs(percentageChange).toFixed(1),
                        isUp: percentageChange > 0
                    })
                }
            } catch (error) {
                console.error("Error fetching chart data:", error)
            }
        }

        fetchChartData()
    }, [title, experienceLevel, location, company])

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Monthly Job Postings</CardTitle>
                <CardDescription>
                    Number of jobs posted per month for current search
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                        height={300}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <defs>
                            <linearGradient id="fillPostings" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-postings)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-postings)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="count"
                            type="monotone"
                            fill="url(#fillPostings)"
                            fillOpacity={0.4}
                            stroke="var(--color-postings)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex flex-col w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex flex-row items-center gap-2 font-medium leading-none">
                        <span>
                            {trend.isUp ? "Trending up" : "Trending down"} by {trend.percentage}% this month{" "}
                            </span>
                            {trend.isUp ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-2 leading-none text-muted-foreground">
                            Last 6 months
                        </div>

</div>
            </CardFooter>
        </Card>
    )
}
