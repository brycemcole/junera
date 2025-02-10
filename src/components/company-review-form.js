import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function CompanyReviewForm({ companyName, initialReview, onReviewSubmitted, onCancel }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comment, setComment] = useState(initialReview?.comment || "");
    const [rating, setRating] = useState(initialReview?.rating || 5);
    const [tags, setTags] = useState(initialReview?.tags || []);
    const [tagInput, setTagInput] = useState("");

    const handleTagAdd = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleTagRemove = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const reviewData = { comment, rating, tags };

        try {
            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/reviews`, {
                method: initialReview ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                toast({ title: "Review Submitted", description: "Your review has been saved." });
                onReviewSubmitted();
            } else {
                throw new Error("Failed to submit review");
            }
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                type="text"
                placeholder="Add a tag (e.g., 'Great Culture')"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleTagAdd())}
            />
            <Button type="button" onClick={handleTagAdd}>Add Tag</Button>

            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-200 rounded-full text-sm">
                        {tag} <button type="button" onClick={() => handleTagRemove(tag)}>×</button>
                    </span>
                ))}
            </div>

            <textarea
                className="w-full border p-2 rounded"
                placeholder="Write your review..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

            <Button type="submit">Submit Review</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </form>
    );
}
