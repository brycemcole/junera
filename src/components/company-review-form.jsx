"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';


export function CompanyReviewForm({ 
    companyName, 
    initialReview = null,
    onReviewSubmitted,
    onCancel 
}) {
    const [rating, setRating] = useState(initialReview?.rating || 0);
    const [comment, setComment] = useState(initialReview?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (initialReview) {
            setRating(initialReview.rating);
            setComment(initialReview.comment);
        }
    }, [initialReview]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please log in to submit a review",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ rating, comment }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit review');
            }

            toast({
                title: "Review submitted",
                description: "Thank you for sharing your experience!",
            });

            setRating(0);
            setComment('');
            if (onReviewSubmitted) {
                await onReviewSubmitted();
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className={`p-1 hover:text-yellow-400 ${
                                rating >= value ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                        >
                            <Star className="w-6 h-6 fill-current" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Your Review</label>
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience working at this company..."
                    required
                    className="min-h-[100px]"
                />
            </div>

            <div className="flex gap-2 justify-end">
                {onCancel && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
                <Button 
                    type="submit" 
                    disabled={isSubmitting || rating === 0 || !comment}
                >
                    {isSubmitting ? 'Submitting...' : initialReview ? 'Update Review' : 'Submit Review'}
                </Button>
            </div>
        </form>
    );
}
