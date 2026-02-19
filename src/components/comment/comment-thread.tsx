import Link from "next/link"

import type { Comment } from "@/lib"
import { CommentItem } from "@/components/comment/comment-item"

type CommentThreadProps = {
  comments: Comment[]
  onChanged?: () => void | Promise<void>
}

const MAX_DEPTH = 6

export function CommentThread({ comments, onChanged }: CommentThreadProps) {
  return (
    <div className="space-y-0.5">
      {comments.map((comment) => {
        const hasMoreDepth = comment.depth >= MAX_DEPTH
        const hasReplies = comment.replies.length > 0

        return (
          <CommentItem key={comment.id} comment={comment} onChanged={onChanged}>
            {hasReplies && hasMoreDepth ? (
              <Link href={`/post/${comment.postId}#${comment.id}`} className="text-primary text-xs hover:underline">
                Continue this thread →
              </Link>
            ) : hasReplies ? (
              <CommentThread comments={comment.replies} onChanged={onChanged} />
            ) : null}
          </CommentItem>
        )
      })}
    </div>
  )
}
