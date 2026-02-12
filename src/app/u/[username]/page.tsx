"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { useParams, useSearchParams } from "next/navigation"

import type { User } from "@/lib"
import { useAuth, profileToUser } from "@/lib/auth"
import type { Profile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { usePostsFeed } from "@/features/posts/presentation/use-posts-feed"
import { useUserComments } from "@/features/posts/presentation/use-user-comments"
import { PostCardCompact } from "@/components/post/post-card-compact"
import { UserProfileHeader } from "@/components/user/user-profile-header"
import { ProfileEditForm } from "@/components/user/profile-edit-form"
import { OrcidBadge } from "@/components/user/orcid-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function UserPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-4xl py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-10 w-48 rounded bg-muted" />
        </div>
      </div>
    }>
      <UserPageContent />
    </Suspense>
  )
}

function UserPageContent() {
  const params = useParams<{ username: string }>()
  const searchParams = useSearchParams()
  const { profile: myProfile, refreshProfile } = useAuth()
  const [pageUser, setPageUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  const isOwnProfile = myProfile?.username === params.username
  const defaultTab = searchParams.get("tab") === "about" ? "about" : "posts"
  const orcidSuccess = searchParams.get("orcid_success") === "true"
  const orcidError = searchParams.get("orcid_error")

  // Clean URL params after ORCID callback and refresh auth context
  useEffect(() => {
    if (orcidSuccess || orcidError) {
      window.history.replaceState({}, "", `/u/${params.username}?tab=about`)
    }
    if (orcidSuccess) {
      refreshProfile()
    }
  }, [orcidSuccess, orcidError, params.username, refreshProfile])

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Try to fetch from Supabase first
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", params.username)
        .maybeSingle()

      if (data) {
        setPageUser(profileToUser(data as Profile))
      } else {
        setPageUser(null)
      }

      setLoading(false)
    }

    load()
  }, [params.username])

  const refreshPageUser = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .maybeSingle()
    if (data) setPageUser(profileToUser(data as Profile))
  }

  const {
    posts: userPosts,
    loading: postsLoading,
    loadingMore: postsLoadingMore,
    error: postsError,
    hasMore: postsHasMore,
    loadMore: loadMorePosts,
  } = usePostsFeed({
    authorId: pageUser?.id,
    sortBy: "new",
    limit: 20,
    enabled: Boolean(pageUser),
  })

  const { comments: userComments, loading: commentsLoading, error: commentsError } = useUserComments({
    authorId: pageUser?.id,
    enabled: Boolean(pageUser),
  })

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-10 w-48 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!pageUser) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <p className="text-lg font-semibold">User not found</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <UserProfileHeader user={pageUser} postCount={userPosts.length} isOwnProfile={isOwnProfile} />

      {isOwnProfile ? (
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          Edit Profile
        </Button>
      ) : null}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-3 space-y-2">
          {postsError ? <p className="text-destructive text-sm">{postsError}</p> : null}
          {postsLoading ? <p className="text-muted-foreground text-sm">Loading posts...</p> : null}
          {!postsLoading && userPosts.length ? (
            <>
              {userPosts.map((post) => <PostCardCompact key={post.id} post={post} />)}
              {postsHasMore ? (
                <div className="flex justify-center py-4">
                  <Button variant="outline" size="sm" onClick={loadMorePosts} disabled={postsLoadingMore}>
                    {postsLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              ) : null}
            </>
          ) : !postsLoading ? (
            <p className="text-muted-foreground text-sm">No posts yet.</p>
          ) : null}
        </TabsContent>

        <TabsContent value="comments" className="mt-3 space-y-2">
          {commentsError ? <p className="text-destructive text-sm">{commentsError}</p> : null}
          {commentsLoading ? <p className="text-muted-foreground text-sm">Loading comments...</p> : null}
          {!commentsLoading && userComments.length ? (
            userComments.map(({ id, content, createdAt, postTitle, postId }) => (
              <Card key={id} className="py-3">
                <CardContent className="space-y-2 px-4">
                  <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
                    <Link href={`/post/${postId}`} className="font-medium text-foreground hover:text-primary">
                      {postTitle}
                    </Link>
                    <span>&bull;</span>
                    <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{content}</p>
                </CardContent>
              </Card>
            ))
          ) : !commentsLoading ? (
            <p className="text-muted-foreground text-sm">No comments yet.</p>
          ) : null}
        </TabsContent>

        <TabsContent value="about" className="mt-3 space-y-4">
          {orcidSuccess ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              ORCID verification successful!
            </div>
          ) : null}
          {orcidError ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {orcidError}
            </div>
          ) : null}

          {/* ORCID (read-only) */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold">ORCID</h3>
              {pageUser.orcidId ? (
                <div className="space-y-1">
                  <OrcidBadge orcidId={pageUser.orcidId} />
                  {pageUser.orcidName ? (
                    <p className="text-muted-foreground text-sm">{pageUser.orcidName}</p>
                  ) : null}
                  {pageUser.orcidVerifiedAt ? (
                    <p className="text-muted-foreground text-xs">
                      Verified {formatDistanceToNow(new Date(pageUser.orcidVerifiedAt), { addSuffix: true })}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not verified</p>
              )}
            </CardContent>
          </Card>

          {/* Affiliation */}
          {(pageUser.position || pageUser.institution || pageUser.department || pageUser.country) ? (
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Affiliation</h3>
                <div className="text-sm space-y-1">
                  {pageUser.position ? <p>{pageUser.position}</p> : null}
                  {pageUser.department ? <p className="text-muted-foreground">{pageUser.department}</p> : null}
                  {pageUser.institution ? <p className="text-muted-foreground">{pageUser.institution}</p> : null}
                  {pageUser.country ? <p className="text-muted-foreground">{pageUser.country}</p> : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Website */}
          {pageUser.websiteUrl ? (
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Website</h3>
                <a
                  href={pageUser.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {pageUser.websiteUrl}
                </a>
              </CardContent>
            </Card>
          ) : null}

          {/* Research Interests */}
          {pageUser.researchInterests && pageUser.researchInterests.length > 0 ? (
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Research Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {pageUser.researchInterests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>

      {isOwnProfile && myProfile ? (
        <ProfileEditForm
          profile={myProfile}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={async () => {
            await refreshProfile()
            await refreshPageUser()
          }}
        />
      ) : null}
    </div>
  )
}
