'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface CommentUser {
  username: string;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: CommentUser;
  replies?: CommentData[];
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const intervals: [number, string][] = [
    [31536000, 'y'], [2592000, 'mo'], [86400, 'd'],
    [3600, 'h'], [60, 'm'],
  ];
  for (const [secs, label] of intervals) {
    const interval = Math.floor(seconds / secs);
    if (interval >= 1) return `${interval}${label} ago`;
  }
  return 'just now';
}

function CommentItem({ comment, postId, onReplyAdded, currentUserId }: {
  comment: CommentData;
  postId: string;
  onReplyAdded: () => void;
  currentUserId?: string;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCommentOwner = currentUserId === comment.userId;

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: replyText, parentCommentId: comment.id }),
      });

      if (res.ok) {
        setReplyText('');
        setReplying(false);
        onReplyAdded();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editText.trim()) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText }),
      });

      if (res.ok) {
        setIsEditing(false);
        onReplyAdded();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onReplyAdded();
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="comment-item">
      <div className="comment-header flex justify-between items-center">
        <span className="comment-author">{comment.user.username}</span>
        <span className="comment-time text-muted">{timeSince(comment.createdAt)}</span>
      </div>

      {isEditing ? (
        <form className="reply-form" onSubmit={handleEdit} style={{ marginBottom: '8px' }}>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={saving} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            {saving ? '...' : 'Save'}
          </button>
          <button type="button" className="secondary" onClick={() => setIsEditing(false)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            Cancel
          </button>
        </form>
      ) : (
        <p className="comment-body">{comment.content}</p>
      )}

      <div className="comment-actions">
        <button
          className="comment-reply-btn"
          onClick={() => setReplying(!replying)}
        >
          {replying ? 'Cancel' : 'Reply'}
        </button>

        {isCommentOwner && !isEditing && (
          <>
            <button
              className="comment-action-btn"
              onClick={() => {
                setEditText(comment.content);
                setIsEditing(true);
              }}
            >
              <Pencil size={12} aria-hidden="true" />
              Edit
            </button>
            <button
              className="comment-action-btn"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={12} aria-hidden="true" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
      </div>

      {replying && (
        <form className="reply-form" onSubmit={handleReply}>
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={submitting} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            {submitting ? '...' : 'Post'}
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} onReplyAdded={onReplyAdded} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  function fetchComments() {
    fetch(`/api/comments?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="comment-section">
      <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
        <span className="text-red">{'//'}</span> Discussion ({comments.length})
      </h3>

      {currentUserId ? (
        <form className="comment-form flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={submitting} style={{ whiteSpace: 'nowrap' }}>
            {submitting ? '...' : 'Post'}
          </button>
        </form>
      ) : (
        <p className="text-muted mb-4">Please log in to participate in the discussion.</p>
      )}

      {loading ? (
        <p className="text-muted mt-4">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-muted mt-4">No comments yet. Start the discussion!</p>
      ) : (
        <div className="comments-list mt-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} onReplyAdded={fetchComments} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
