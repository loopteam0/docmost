import React from "react";
import { Editor } from "@tiptap/core";
import { CommentsConfig } from "./types";
import CommentDialog from "@/features/comment/components/comment-dialog";

/**
 * Setup comment event listeners
 */
export function setupCommentListeners(
  editor: Editor,
  config: CommentsConfig,
  handlers: {
    onActiveComment: (commentId: string, resolved: boolean) => void;
  },
): () => void {
  if (!config.enabled) {
    return () => {}; // No-op cleanup
  }

  const handleActiveCommentEvent = (event: CustomEvent) => {
    const { commentId, resolved } = event.detail;
    handlers.onActiveComment(commentId, resolved);
  };

  document.addEventListener(
    "ACTIVE_COMMENT_EVENT",
    handleActiveCommentEvent as EventListener,
  );

  return () => {
    document.removeEventListener(
      "ACTIVE_COMMENT_EVENT",
      handleActiveCommentEvent as EventListener,
    );
  };
}

/**
 * Comment Dialog Component (conditionally rendered)
 */
export function CommentDialogWrapper({
  enabled,
  editor,
  pageId,
}: {
  enabled: boolean;
  editor: Editor;
  pageId?: string;
}) {
  if (!enabled || !pageId) {
    return null;
  }

  return <CommentDialog editor={editor} pageId={pageId} />;
}
