import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "./ui/button";
import { Flag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportPopover({ jobId }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        reportType: "",
        comments: ""
    });
    const [error, setError] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.reportType) {
            setError("Please select a report type");
            return;
        }

        if (formData.reportType === "other" && !formData.comments.trim()) {
            setError("Please provide additional details for 'other' report type");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/job-postings/${jobId}/report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token") && {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    })
                },
                body: JSON.stringify({
                    reportType: formData.reportType,
                    comments: formData.comments
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit report");
            }

            toast({
                title: "Report Submitted",
                description: "Thank you for your feedback",
                variant: "default",
            });
            
            setOpen(false);
            setFormData({ reportType: "", comments: "" });
        } catch (error) {
            setError(error.message);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="default" className="w-9" variant="outline"><Flag size={16} /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mx-4">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Report Job Posting</h4>
                        <p className="text-sm text-muted-foreground">
                            Report an issue with this job posting
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="missingInformation"
                                    name="reportType"
                                    value="missingInformation"
                                    className="h-4 w-4"
                                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                                    checked={formData.reportType === "missingInformation"}
                                />
                                <label htmlFor="missingInformation" className="text-sm">
                                    Missing Information
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="inactiveJob"
                                    name="reportType"
                                    value="inactiveJob"
                                    className="h-4 w-4"
                                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                                    checked={formData.reportType === "inactiveJob"}
                                />
                                <label htmlFor="inactiveJob" className="text-sm">
                                    Inactive Job Posting
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="incorrectDetails"
                                    name="reportType"
                                    value="incorrectDetails"
                                    className="h-4 w-4"
                                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                                    checked={formData.reportType === "incorrectDetails"}
                                />
                                <label htmlFor="incorrectDetails" className="text-sm">
                                    Incorrect Job Details
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="other"
                                    name="reportType"
                                    value="other"
                                    className="h-4 w-4"
                                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                                    checked={formData.reportType === "other"}
                                />
                                <label htmlFor="other" className="text-sm">
                                    Other
                                </label>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="comments" className="text-sm font-medium">
                                Additional Comments {formData.reportType === "other" && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                id="comments"
                                rows="3"
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Provide more details here..."
                                value={formData.comments}
                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Report"
                            )}
                        </Button>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    );
}