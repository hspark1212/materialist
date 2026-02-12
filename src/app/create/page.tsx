import { PostComposer } from "@/components/post/post-composer"

export default function CreatePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Create Post</h1>
      <PostComposer />
    </div>
  )
}
