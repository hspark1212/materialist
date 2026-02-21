"use client"

import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { toast } from "sonner"
import type { ForumFlair, JobType, Post, Section, ShowcaseType } from "@/lib"
import { event } from "@/lib/analytics/gtag"
import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { forumFlairs, jobTypeLabels, sections, showcaseTypeFilters, showcaseTypeLabels } from "@/lib/sections"
import { UserAvatar } from "@/components/user/user-avatar"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { MarkdownToolbar } from "@/components/editor/markdown-toolbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type PostComposerProps = {
  initialPost?: Post
}

export function PostComposer({ initialPost }: PostComposerProps) {
  const isEditMode = Boolean(initialPost)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status } = useAuth()
  const { activeUser, isAnonymousMode } = useIdentity()
  const [section, setSection] = useState<Section>(initialPost?.section ?? "forum")
  const [flair, setFlair] = useState<ForumFlair>(initialPost?.flair ?? "discussion")
  const [title, setTitle] = useState(initialPost?.title ?? "")
  const [url, setUrl] = useState(initialPost?.url ?? "")
  const [content, setContent] = useState(initialPost?.content ?? "")
  const [projectUrl, setProjectUrl] = useState(initialPost?.projectUrl ?? "")
  const [techStack, setTechStack] = useState(initialPost?.techStack?.join(", ") ?? "")
  const [showcaseType, setShowcaseType] = useState<ShowcaseType>(initialPost?.showcaseType ?? "tool")
  const [company, setCompany] = useState(initialPost?.company ?? "")
  const [location, setLocation] = useState(initialPost?.location ?? "")
  const [jobType, setJobType] = useState<JobType>(initialPost?.jobType ?? "full-time")
  const [applicationUrl, setApplicationUrl] = useState(initialPost?.applicationUrl ?? "")
  const [deadline, setDeadline] = useState(initialPost?.deadline ?? "")
  const [tags, setTags] = useState(initialPost?.tags?.join(", ") ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedTags = useMemo(() => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }, [tags])

  const parsedTechStack = useMemo(() => {
    return techStack
      .split(",")
      .map((tech) => tech.trim())
      .filter(Boolean)
  }, [techStack])

  const inputClassName =
    "bg-background/80 border-border/80 shadow-sm transition-[border-color,box-shadow,background-color] hover:bg-background focus-visible:border-ring focus-visible:bg-background dark:bg-background/50"

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (status === "anonymous") {
      toast.info("Sign in to create a post.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const endpoint = isEditMode ? `/api/posts/${initialPost!.id}` : "/api/posts"
      const method = isEditMode ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          section,
          tags: parsedTags,
          isAnonymous: isAnonymousMode,
          flair: section === "forum" ? flair : undefined,
          url,
          projectUrl,
          techStack: parsedTechStack,
          showcaseType,
          company,
          location,
          jobType,
          applicationUrl,
          deadline: section === "jobs" ? deadline : undefined,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? (isEditMode ? "Failed to update post" : "Failed to create post"))
      }

      if (isEditMode) {
        event("post_updated", { section, post_id: initialPost!.id })
        router.push(`/post/${initialPost!.id}`)
      } else {
        event("post_created", { section, post_id: payload.post.id })
        router.push(`/post/${payload.post.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditMode ? "Failed to update post" : "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = activeUser?.displayName ?? "Anonymous"

  return (
    <Card className="bg-card/80 py-4 shadow-sm">
      <CardHeader className="px-4 pb-2 sm:px-6">
        <CardTitle>{isEditMode ? "Edit post" : "Compose your research post"}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="border-border/60 bg-muted/20 space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Section</p>
            <ToggleGroup
              type="single"
              value={section}
              onValueChange={(value) => {
                if (value && !isEditMode) {
                  setSection(value as Section)
                }
              }}
              variant="outline"
              size="sm"
              spacing={1}
              disabled={isEditMode}
            >
              {sections.map((entry) => (
                <ToggleGroupItem
                  key={entry.key}
                  value={entry.key}
                  className="gap-2 transition-colors hover:border-[var(--section-color)] hover:bg-[color-mix(in_srgb,var(--section-color)_10%,transparent)] hover:text-[var(--section-color)] data-[state=on]:border-[var(--section-color)] data-[state=on]:bg-[color-mix(in_srgb,var(--section-color)_12%,transparent)] data-[state=on]:text-[var(--section-color)]"
                  style={{ "--section-color": entry.color } as CSSProperties}
                >
                  <entry.icon className="size-4" />
                  <span className="hidden sm:inline">{entry.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {section === "forum" ? (
            <div className="border-border/60 bg-muted/20 space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Flair</p>
              <Select value={flair} onValueChange={(value) => setFlair(value as ForumFlair)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose flair" />
                </SelectTrigger>
                <SelectContent>
                  {forumFlairs.map((entry) => (
                    <SelectItem key={entry.key} value={entry.key}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {section === "showcase" ? (
            <div className="border-border/60 bg-muted/20 grid gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-medium">Project URL</p>
                <Input
                  className={inputClassName}
                  value={projectUrl}
                  onChange={(event) => setProjectUrl(event.target.value)}
                  placeholder="https://github.com/org/project"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-medium">Tech Stack</p>
                <Input
                  className={inputClassName}
                  value={techStack}
                  onChange={(event) => setTechStack(event.target.value)}
                  placeholder="PyTorch, ASE, pymatgen"
                />
                {parsedTechStack.length ? (
                  <p className="text-muted-foreground text-xs">Stack: {parsedTechStack.join(" ")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Showcase Type</p>
                <Select value={showcaseType} onValueChange={(value) => setShowcaseType(value as ShowcaseType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose showcase type" />
                  </SelectTrigger>
                  <SelectContent>
                    {showcaseTypeFilters.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {showcaseTypeLabels[entry]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {section === "jobs" ? (
            <div className="border-border/60 bg-muted/20 grid gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Company</p>
                <Input
                  className={inputClassName}
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Company or lab"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Location</p>
                <Input
                  className={inputClassName}
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Remote, city, country"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Job Type</p>
                <Select value={jobType} onValueChange={(value) => setJobType(value as JobType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(jobTypeLabels).map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {jobTypeLabels[entry as JobType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Application URL</p>
                  <span className="text-muted-foreground border-border/60 rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
                    Optional
                  </span>
                </div>
                <Input
                  className={inputClassName}
                  value={applicationUrl}
                  onChange={(event) => setApplicationUrl(event.target.value)}
                  placeholder="https://company.com/jobs/role"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Application Deadline</p>
                  <span className="text-muted-foreground border-border/60 rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
                    Optional
                  </span>
                </div>
                <Input
                  type="date"
                  className={inputClassName}
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="border-border/60 bg-muted/20 space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Title</p>
            <Input
              className={inputClassName}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write a concise, specific title"
            />
          </div>

          <div className="border-border/60 bg-muted/20 space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Content</p>
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="bg-muted/40 p-1">
                <TabsTrigger
                  value="write"
                  className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Write
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-2 space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="border-border/80 bg-background/70 hover:bg-background focus-visible:border-ring focus-visible:bg-background min-h-[220px] resize-y rounded-lg border font-mono shadow-sm transition-[border-color,box-shadow,background-color]"
                  placeholder="Share context, methods, and what feedback you need"
                />
                <MarkdownToolbar textareaRef={textareaRef} value={content} onValueChange={setContent} variant="full" />
              </TabsContent>
              <TabsContent value="preview" className="mt-2 space-y-2">
                <div className="border-border/80 bg-background/70 dark:bg-background/50 min-h-[220px] rounded-md border px-3 py-2 text-sm shadow-sm">
                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-muted-foreground">Start writing to preview markdown output.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {section !== "showcase" && section !== "jobs" ? (
            <div className="border-border/60 bg-muted/20 space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{section === "papers" ? "Paper URL" : "Link URL"}</p>
                <span className="text-muted-foreground border-border/60 rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
                  Optional
                </span>
              </div>
              <Input
                className={inputClassName}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={section === "papers" ? "https://arxiv.org/abs/2602.04219" : "https://example.com"}
              />
            </div>
          ) : null}

          <div className="border-border/60 bg-muted/20 space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Tags</p>
              <span className="text-muted-foreground border-border/60 rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase">
                Optional
              </span>
            </div>
            <Input
              className={inputClassName}
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="mlff, benchmark, uncertainty"
            />
            {parsedTags.length ? (
              <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                <span className="tracking-wide uppercase">Tags</span>
                <span className="flex flex-wrap gap-1.5">
                  {parsedTags.map((tag) => (
                    <span key={tag} className="border-border/60 bg-background/70 rounded-full border px-2 py-0.5">
                      #{tag}
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
          </div>

          <div className="border-border/60 bg-muted/20 flex items-center gap-2 rounded-md border p-3">
            {activeUser ? <UserAvatar user={activeUser} size="md" /> : null}
            <p className="text-muted-foreground text-sm" suppressHydrationWarning>
              Posting as{" "}
              <span className="text-foreground font-medium" suppressHydrationWarning>
                {displayName}
              </span>
              {isAnonymousMode ? " · anonymous mode" : null}
            </p>
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? (isEditMode ? "Saving..." : "Submitting...") : isEditMode ? "Save Changes" : "Submit Post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
