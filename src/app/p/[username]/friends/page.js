"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/context/AuthContext";
import * as React from "react";
import { useRouter } from "next/navigation";

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
          {requests.length > 0 ? (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">Requests</h2>
              <ul className="list-disc pl-6">
                {displayedRequests.map((request) => (
                  <li key={request.id} className="mb-2">
                    <div>
                      <strong>{request.username}</strong> ({request.firstname} {request.lastname})
                    </div>
                    <small>
                      Requested since:{" "}
                      {request.followed_since
                        ? new Date(request.followed_since).toLocaleDateString()
                        : "Unknown"}
                    </small>
                  </li>
                ))}
              </ul>
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

          {/* Friends */}
          {friends.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-2">Friends</h2>
              <ul className="list-disc pl-6">
                {friends.map((friend) => (
                  <li key={friend.id} className="mb-2">
                    <div>
                      <strong>{friend.username}</strong> ({friend.firstname} {friend.lastname})
                    </div>
                    <small>
                      Friends since:{" "}
                      {friend.follower_since
                        ? new Date(friend.follower_since).toLocaleDateString()
                        : "Unknown"}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No friends found.</p>
          )}

          {/* Following */}
          {following.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold mb-2">Following</h2>
              <ul className="list-disc pl-6">
                {following.map((follow) => (
                  <li key={follow.id} className="mb-2">
                    <div>
                      <strong>{follow.username}</strong> ({follow.firstname} {follow.lastname})
                    </div>
                    <small>
                      Following since:{" "}
                      {follow.followed_since
                        ? new Date(follow.followed_since).toLocaleDateString()
                        : "Unknown"}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No following found.</p>
          )}
        </div>
      </div>
    </div>
  );
}