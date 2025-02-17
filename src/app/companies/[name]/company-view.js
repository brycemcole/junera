"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronLeft, ChevronRight, Factory, MapPin, Pencil, ShareIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobList } from "@/components/JobPostings";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bell, Share2, Building2, Star } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyReviewForm } from '@/components/company-review-form';
import { formatDistanceToNow, format } from "date-fns";
import { Briefcase } from "lucide-react";

export default function CompanyView({ companyName, page }) {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [company, setCompany] = useState(null);
    const [companyJobCount, setCompanyJobCount] = useState(0);
    const [jobPostings, setJobPostings] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [experiences, setExperiences] = useState([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        async function fetchCompanyData() {
            try {
                setLoading(true);
                // Decode the company name from the URL and re-encode it properly
                const decodedName = decodeURIComponent(companyName);
                const response = await fetch(`/api/companies/${encodeURIComponent(decodedName)}?page=${page}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    throw new Error(errorData.error || 'Failed to fetch company data');
                }

                const data = await response.json();
                console.log('Company Data:', data); // Debug log

                if (!data.company) {
                    throw new Error('No company data received');
                }

                setCompany(data.company);
                setJobPostings(data.jobPostings || []);
                setPagination(data.pagination);
                setError(null);
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        async function fetchCompanyJobCount() {
            try {
                const response = await fetch(`/api/job-postings/count?company=${encodeURIComponent(companyName)}`);
                if (!response.ok) throw new Error('Failed to fetch job count');
                const data = await response.json();
                if (!data.ok) throw new Error('Invalid response structure');
                if (!data.count) throw new Error('Invalid job count data');
                setCompanyJobCount(data.count);
            } catch (error) {
                console.error('Error fetching job count:', error);
            }
        }

        if (companyName && !isMounted) {
            fetchCompanyJobCount();
            fetchCompanyData();
            setIsMounted(true);
        }
    }, [companyName, page, isMounted]);

    // Add initial follow status check
    useEffect(() => {
        async function checkFollowStatus() {
            if (!user || !company) return;

            try {
                const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/follow`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsFollowing(data.isFollowing);
                }
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        }

        checkFollowStatus();
    }, [user, company, companyName]);

    const fetchReviews = async () => {
        try {
            // Add Authorization header if user exists
            const headers = user ? {
                'Authorization': `Bearer ${user.token}`
            } : {};

            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/reviews`, {
                headers
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Fetched reviews:', data.reviews); // Debug log
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const fetchExperiences = async () => {
        try {
            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/experiences`);
            if (response.ok) {
                const data = await response.json();
                setExperiences(data.experiences);
            }
        } catch (error) {
            console.error('Error fetching experiences:', error);
        }
    };

    // Move fetch functions inside useCallback to prevent infinite loops
    const fetchReviewsCallback = useCallback(fetchReviews, [companyName, user]);
    const fetchExperiencesCallback = useCallback(fetchExperiences, [companyName]);

    // Update the effect hooks to use the memoized callbacks
    useEffect(() => {
        if (companyName) {
            fetchReviewsCallback();
        }
    }, [companyName, fetchReviewsCallback]);

    useEffect(() => {
        if (companyName) {
            fetchExperiencesCallback();
        }
    }, [companyName, fetchExperiencesCallback]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages && newPage !== page) {
            //Scroll to the top of the page when a new page is presented
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            router.push(`/companies/${companyName}?page=${newPage}`);
        }
    };

    const handleFollow = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please log in to follow companies",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/follow`, {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
                toast({
                    title: isFollowing ? "Unfollowed" : "Following",
                    description: `You are ${isFollowing ? 'no longer following' : 'now following'} ${company.company_name}`,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update follow status",
                variant: "destructive",
            });
        }
    };

    const handleClaimCompany = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please log in to claim this company",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Claim request sent",
            description: "We'll review your request and get back to you soon.",
        });
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setShowReviewForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteReview = async (reviewId) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}/reviews?reviewId=${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                toast({
                    title: "Review deleted",
                    description: "Your review has been deleted successfully.",
                });
                await fetchReviews(); // Refresh reviews
            } else {
                throw new Error('Failed to delete review');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete review",
                variant: "destructive",
            });
        }
    };

    const debugReview = (review) => {
        console.log('Review data:', {
            id: review.id,
            username: review.username,
            isOwnReview: review.is_own_review,
            userId: review.user_id
        });
        return (
            <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={review.avatar} />
                            <AvatarFallback>{review.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{review.username}</p>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={i < review.rating ? "fill-current" : "text-gray-300"}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    {review.is_own_review && (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditReview(review)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReview(review.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                </p>
            </div>
        );
    };

    if (loading) {
        return <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-900 rounded-xl w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-900 rounded-xl w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-900 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>;
    }

    if (error || !company) {
        return <div className="container mx-auto py-6 px-4 max-w-4xl">
            <p className="text-red-500">Error loading company data.</p>
        </div>;
    }

    return (
        <div className="container mx-auto sm:py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={company.logo} alt={company.company_name} />
                        <AvatarFallback>{company.company_name[0]}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold">{company.company_name}</h1>
                </div>

                {(company.hiring_url || company.hiring_url2 || company.hiring_url3) && (
                    <div className="space-y-2">
                        {[company.hiring_url, company.hiring_url2, company.hiring_url3]
                            .filter(Boolean)
                            .map((url, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-blue-600 hover:underline"
                                >
                                    {url}
                                </a>
                            ))}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <Button
                    variant="outline"
                    className={cn(
                        "gap-2 hover:bg-green-100/20 hover:border-green-600/20",
                        isFollowing && "bg-green-500/20 border-green-600/20 text-primary"
                    )}
                    onClick={handleFollow}
                >
                    {isFollowing ? (
                        <>
                            Following
                        </>
                    ) : (
                        <>
                            Follow
                        </>
                    )}
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="gap-2">
                            <ShareIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 mx-6 mt-2">
                        <div className="space-y-4">
                            <h4 className="font-medium leading-none">Share Company Profile</h4>
                            <div className="space-y-2">
                                <Label htmlFor="company-url">Company URL</Label>
                                <div className="flex space-x-2">
                                    <Input
                                        id="company-url"
                                        defaultValue={window.location.href}
                                        readOnly
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                    >
                                        {copied ? "Copied!" : "Copy"
                                        }
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {user && user.isCompany && (
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleClaimCompany}
                    >
                        <Building2 className="h-4 w-4" />
                        Claim Company
                    </Button>
                )}
            </div>

            <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-md font-semibold">Company Reviews</h2>
                    {user && (
                        <Button
                            variant="outline"
                            onClick={() => setShowReviewForm(!showReviewForm)}
                        >
                            Write a Review
                        </Button>
                    )}
                </div>

                {showReviewForm && (
                    <CompanyReviewForm
                        companyName={companyName}
                        initialReview={editingReview}
                        onReviewSubmitted={async () => {
                            setShowReviewForm(false);
                            setEditingReview(null);
                            await fetchReviews();
                        }}
                        onCancel={() => {
                            setShowReviewForm(false);
                            setEditingReview(null);
                        }}
                    />
                )}

                <div className="space-y-4">
                    {reviews.map(review => debugReview(review))}
                    {reviews.length === 0 && (
                        !user ? (
                            <p className="text-muted-foreground text-sm">
                                Please <Link href="/login" className="underline underline-offset-4">login</Link> to share your review of {company.company_name}.
                            </p>
                        ) : (
                            <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
                        )
                    )}
                </div>
            </div>

            <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-md font-semibold">People who have worked at {company.company_name}</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    {experiences.map((person) => (
                        <Link
                            key={person.id}
                            href={`/profile/${encodeURIComponent(person.username)}`}
                            className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={person.avatar} />
                                <AvatarFallback>{person.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{person.username}</span>
                        </Link>
                    ))}
                    {experiences.length === 0 ? !user ? (
                        <p className="text-muted-foreground text-sm">
                            No one has shared their experience working at {company.company_name} yet.
                        </p>
                    ) :
                        (
                            <p className="text-muted-foreground text-sm">
                                Worked at {company.company_name}? Share your experience on your <Link className="underline underline-offset-4 text-foreground" href={`/profile/${user.username}`}>profile</Link>
                            </p>
                        )
                        :
                        <></>
                    }
                </div>
            </div>

            <div className="space-y-6"></div>
            <h2 className="text-md font-semibold">{companyJobCount} Job Postings</h2>
            <JobList data={jobPostings} loading={loading} error={error} />

            {pagination && (
                <Pagination>
                    <PaginationContent className="w-full justify-between">
                        <PaginationItem>
                            <PaginationLink
                                className={cn(
                                    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
                                    buttonVariants({
                                        variant: "outline",
                                    }),
                                )}
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                aria-label="Go to previous page"
                                aria-disabled={pagination.current_page === 1}
                            >
                                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                            </PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                            <p className="text-sm text-muted-foreground" aria-live="polite">
                                Page <span className="text-foreground">{pagination.current_page}</span> of{" "}
                                <span className="text-foreground">{pagination.total_pages}</span>
                            </p>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationLink
                                className={cn(
                                    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
                                    buttonVariants({
                                        variant: "outline",
                                    }),
                                )}
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                aria-label="Go to next page"
                                aria-disabled={pagination.current_page === pagination.total_pages}
                            >
                                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )
            }
        </div >
    );
}
