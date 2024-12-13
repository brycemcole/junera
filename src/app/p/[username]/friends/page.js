"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function StatusDot({ className }) {
  return (
    <svg
      width="8"
      height="8"
      fill="currentColor"
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}

 function StatusSelect() {
  return (
    <div className="space-y-2">
      <Select defaultValue="s1">
        <SelectTrigger
          id="select-32"
          className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0"
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
          <SelectItem value="s1">
            <span className="flex items-center gap-2">
              <StatusDot className="text-emerald-600" />
              <span className="truncate">Friends</span>
            </span>
          </SelectItem>
          <SelectItem value="s2">
            <span className="flex items-center gap-2">
              <StatusDot className="text-blue-500" />
              <span className="truncate">Associates</span>
            </span>
          </SelectItem>
          <SelectItem value="s3">
            <span className="flex items-center gap-2">
              <StatusDot className="text-amber-500" />
              <span className="truncate">Following</span>
            </span>
          </SelectItem>
          <SelectItem value="s5">
            <span className="flex items-center gap-2">
              <StatusDot className="text-red-500" />
              <span className="truncate">Remove</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function Page({ params }) {
  const { username } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [relationships, setRelationships] = React.useState({
    requests: [],
    friends: [],
    following: [],
  });
  const [loadingRelationships, setLoadingRelationships] = React.useState(true);
  const [showAllRequests, setShowAllRequests] = React.useState(false);

  React.useEffect(() => {
    // Redirect user if viewing another user's page
    if (!loading && user?.username !== username) {
      router.push(`/p/${user.username}/friends`);
      return;
    }

    async function fetchRelationships() {
      try {
        const response = await fetch(`/api/user/${username}/friends`);
        const data = await response.json();
        setRelationships(data);
      } catch (error) {
        console.error("Error fetching relationships:", error);
      } finally {
        setLoadingRelationships(false);
      }
    }

    fetchRelationships();
  }, [username, loading, router, user]);

  if (!username || loading || !user || loadingRelationships) {
    return <p>Loading...</p>;
  }

  const { requests, friends, following } = relationships;
  const displayedRequests = showAllRequests ? requests : requests.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-4xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/p">Profiles</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/p/${username}`}>{username}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/p/${username}/friends`}>Friends</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          {/* Requests */}
          <section className="mb-4">
          {requests.length > 0 ? (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">Requests</h2>
                {displayedRequests.map((request) => (
                  <div key={request.id} className="mb-2">
                    <div>
                      <strong>{request.username}</strong> ({request.firstname} {request.lastname})
                    </div>
                    <small>
                      Requested since:{" "}
                      {request.followed_since
                        ? new Date(request.followed_since).toLocaleDateString()
                        : "Unknown"}
                    </small>
                  </div>
                ))}
              {requests.length > 3 && (
                <button
                  className="text-blue-500 underline mt-2"
                  onClick={() => setShowAllRequests((prev) => !prev)}
                >
                  {showAllRequests ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          ) : (
            <p>No requests found.</p>
          )}
          </section>
          <section className="mb-4">
          {/* Friends */}
          {friends.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-2">Friends ({friends.length})</h2>
                {friends.map((friend) => (
                  <div key={friend.id} className="mb-4 flex flex-row gap-4 items-center">
                    <Avatar alt={friend.username} className="w-8 h-8 rounded-full">
                      <AvatarImage src={friend.avatar} alt={friend.username} />
                      <AvatarFallback>{friend.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col"> 
                    <div onClick={() => router.push(`/p/${friend.username}`)} className="cursor-pointer">
                    <p className="text-foreground font-medium">
                    {friend.firstname} {friend.lastname}
                    </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{friend.username}
                    </p>
                    </div>
                    <div className="ml-auto"> 
                    <StatusSelect />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p>No friends found.</p>
          )}
          </section>

          {/* Following */}
          <section className="mb-4">
          {following.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-2">Following ({following.length})</h2>
                {following.map((follow) => (
                  <div key={follow.id} className="mb-4 flex flex-row gap-4 items-center">
                  <Avatar alt={follow.username} className="w-8 h-8 rounded-full">
                    <AvatarImage src={follow.avatar} alt={follow.username} />
                    <AvatarFallback>{follow.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col"> 
                  <div onClick={() => router.push(`/p/${follow.username}`)} className="cursor-pointer">
                  <p className="text-foreground font-medium">
                  {follow.firstname} {follow.lastname}
                  </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{follow.username}
                  </p>
                  </div>
                  <div className="ml-auto"> 
                  <StatusSelect />
                  </div>
                </div>
                ))}
            </div>
          ) : (
            <p>No following found.</p>
          )}
          </section>
        </div>
      </div>
    </div>
  );
}