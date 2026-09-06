"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Trash2, CornerDownRight } from "lucide-react";
import { addComment, deleteComment } from "@/lib/actions/social";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  author_name: string;
};

function ReplyForm({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText("");
      }}
      className="mt-1 flex items-center gap-2"
    >
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded-full bg-brand-gradient px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}

function CommentRow({
  comment,
  replies,
  currentUserId,
  canModerate,
  isLoggedIn,
  onReply,
  onDelete,
}: {
  comment: Comment;
  replies: Comment[];
  currentUserId: string | null;
  canModerate: boolean;
  isLoggedIn: boolean;
  onReply: (parentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-2 text-sm">
        <p>
          <span className="font-medium">{comment.author_name}</span>{" "}
          <span className="text-white/70">{comment.content}</span>
        </p>
        {(comment.user_id === currentUserId || canModerate) && (
          <button onClick={() => onDelete(comment.id)} className="flex-shrink-0 text-white/20 hover:text-danger" aria-label="Delete comment">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoggedIn && (
        <button onClick={() => setReplying((r) => !r)} className="mt-0.5 text-xs text-white/30 hover:text-white/60">
          Reply
        </button>
      )}

      {replying && (
        <div className="pl-4">
          <div className="flex items-center gap-1.5 text-white/20">
            <CornerDownRight className="h-3.5 w-3.5 flex-shrink-0" />
            <ReplyForm
              placeholder={`Reply to ${comment.author_name}...`}
              onSubmit={(text) => {
                onReply(comment.id, text);
                setReplying(false);
              }}
            />
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-white/5 pl-3">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-2 text-sm">
              <p>
                <span className="font-medium">{r.author_name}</span> <span className="text-white/70">{r.content}</span>
              </p>
              {(r.user_id === currentUserId || canModerate) && (
                <button onClick={() => onDelete(r.id)} className="flex-shrink-0 text-white/20 hover:text-danger" aria-label="Delete comment">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({
  postId,
  comments: initialComments,
  commentCount: initialCount,
  currentUserId,
  canModerate,
  isLoggedIn,
}: {
  postId: string;
  comments: Comment[];
  commentCount: number;
  currentUserId: string | null;
  canModerate: boolean;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [, startTransition] = useTransition();

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      if (!repliesByParent.has(c.parent_id)) repliesByParent.set(c.parent_id, []);
      repliesByParent.get(c.parent_id)!.push(c);
    }
  }

  function postComment(content: string, parentId: string | null) {
    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      user_id: currentUserId ?? "",
      parent_id: parentId,
      author_name: "You",
    };
    setComments((prev) => [...prev, optimistic]);

    const formData = new FormData();
    formData.set("post_id", postId);
    formData.set("content", content);
    if (parentId) formData.set("parent_id", parentId);
    startTransition(() => {
      addComment(formData);
    });
  }

  function handleDelete(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
    startTransition(() => {
      deleteComment(commentId);
    });
  }

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-white/50 hover:text-white">
        <MessageCircle className="h-4 w-4" />
        {Math.max(initialCount, comments.length)}
      </button>

      {open && (
        <div className="mt-2 space-y-3 border-t border-white/5 pt-2">
          {topLevel.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              replies={repliesByParent.get(c.id) ?? []}
              currentUserId={currentUserId}
              canModerate={canModerate}
              isLoggedIn={isLoggedIn}
              onReply={(parentId, text) => postComment(text, parentId)}
              onDelete={handleDelete}
            />
          ))}

          {isLoggedIn ? (
            <ReplyForm placeholder="Write a comment..." onSubmit={(text) => postComment(text, null)} />
          ) : (
            <p className="pt-1 text-xs text-white/30">Log in to comment.</p>
          )}
        </div>
      )}
    </div>
  );
}
