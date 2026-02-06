import "@/features/editor/styles/index.css";
import React, { useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { useAtom } from "jotai";
import useCollaborationUrl from "@/features/editor/hooks/use-collaboration-url";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import {
  pageEditorAtom,
  yjsConnectionStatusAtom,
} from "@/features/editor/atoms/editor-atoms";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import {
  activeCommentIdAtom,
  showCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import { useDebouncedCallback } from "@mantine/hooks";
import { queryClient } from "@/main.tsx";
import { IPage } from "@/features/page/types/page.types.ts";
import { useParams } from "react-router-dom";
import { extractPageSlugId } from "@/lib";
import { PageEditMode } from "@/features/user/types/user.types.ts";
import { useEditorScroll } from "./hooks/use-editor-scroll";
import { useCollabToken } from "@/features/auth/queries/auth-query.tsx";
import { BaseEditor } from "@/features/editor/base-editor";
import {
  handleFileDrop,
  handlePaste,
} from "@/features/editor/components/common/editor-paste-handler.tsx";

interface PageEditorProps {
  pageId: string;
  editable: boolean;
  content: any;
}

/**
 * PageEditor - Full-featured collaborative page editor
 *
 * This is now a wrapper around BaseEditor that adds page-specific functionality:
 * - React Query cache updates
 * - Page-specific atoms (pageEditorAtom, yjsConnectionStatusAtom)
 * - Comment integration
 * - User edit mode preferences
 * - Y.js/Hocuspocus collaboration
 *
 * The public API remains unchanged for backward compatibility.
 */
export default function PageEditor({
  pageId,
  editable,
  content,
}: PageEditorProps) {
  const collaborationURL = useCollaborationUrl();
  const isComponentMounted = useRef(false);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    isComponentMounted.current = true;
  }, []);

  const [currentUser] = useAtom(currentUserAtom);
  const [, setEditor] = useAtom(pageEditorAtom);
  const [, setAsideState] = useAtom(asideStateAtom);
  const [, setActiveCommentId] = useAtom(activeCommentIdAtom);
  const [, setShowCommentPopup] = useAtom(showCommentPopupAtom);
  const [, setYjsConnectionStatus] = useAtom(yjsConnectionStatusAtom);

  const { data: collabQuery } = useCollabToken();
  const { pageSlug } = useParams();
  const slugId = extractPageSlugId(pageSlug);

  const userPageEditMode =
    currentUser?.user?.settings?.preferences?.pageEditMode ?? PageEditMode.Edit;

  const canScroll = useCallback(
    () => Boolean(isComponentMounted.current && editorRef.current),
    [isComponentMounted],
  );
  const { handleScrollTo } = useEditorScroll({ canScroll });

  // Debounced React Query cache update (page-specific logic)
  const debouncedUpdateContent = useDebouncedCallback((newContent: any) => {
    const pageData = queryClient.getQueryData<IPage>(["pages", slugId]);

    if (pageData) {
      queryClient.setQueryData(["pages", slugId], {
        ...pageData,
        content: newContent,
        updatedAt: new Date(),
      });
    }
  }, 3000);

  // Handle create callback
  const handleCreate = useCallback(
    (editor: Editor) => {
      // @ts-ignore
      setEditor(editor);
      // @ts-ignore - Store pageId in editor storage for slash menu
      editor.storage.pageId = pageId;
      handleScrollTo(editor);
      editorRef.current = editor;
    },
    [pageId, setEditor, handleScrollTo],
  );

  // Handle update callback
  const handleUpdate = useCallback(
    (newContent: any, editor: Editor) => {
      if (editor.isEmpty) return;
      debouncedUpdateContent(newContent);
    },
    [debouncedUpdateContent],
  );

  // Handle connection status updates
  const handleConnectionStatus = useCallback(
    (status: string) => {
      setYjsConnectionStatus(status);
    },
    [setYjsConnectionStatus],
  );

  // Setup comment event listeners (page-specific)
  useEffect(() => {
    const handleActiveCommentEvent = (event: any) => {
      const { commentId, resolved } = event.detail;

      if (resolved) {
        return;
      }

      setActiveCommentId(commentId);
      setAsideState({ tab: "comments", isAsideOpen: true });

      // Wait if aside is closed
      setTimeout(() => {
        const selector = `div[data-comment-id="${commentId}"]`;
        const commentElement = document.querySelector(selector);
        commentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    };

    document.addEventListener("ACTIVE_COMMENT_EVENT", handleActiveCommentEvent);
    return () => {
      document.removeEventListener("ACTIVE_COMMENT_EVENT", handleActiveCommentEvent);
    };
  }, [setActiveCommentId, setAsideState]);

  // Reset comment state when page changes
  useEffect(() => {
    setActiveCommentId(null);
    setShowCommentPopup(false);
    setAsideState({ tab: "", isAsideOpen: false });
  }, [pageId, setActiveCommentId, setShowCommentPopup, setAsideState]);

  // Apply user edit mode preference
  const effectiveEditable = editable && userPageEditMode === PageEditMode.Edit;

  return (
    <div className="editor-container" style={{ position: "relative" }}>
      <BaseEditor
        preset="full"
        content={content}
        editable={effectiveEditable}
        // Collaboration configuration
        collaboration={
          collabQuery?.token && currentUser?.user
            ? {
                documentName: `page.${pageId}`,
                user: currentUser.user,
                token: collabQuery.token,
                url: collaborationURL,
                onConnectionStatus: handleConnectionStatus,
              }
            : false
        }
        // Comments configuration
        comments={{
          enabled: true,
          pageId: pageId,
        }}
        // Upload configuration (using existing upload actions)
        uploads={{
          onUpload: async (file: File, context: any) => {
            // This is a placeholder - actual upload is handled by upload actions
            // in the paste/drop handlers below
            return {} as any;
          },
          context: pageId,
          enableImages: true,
          enableVideos: true,
          enableAttachments: true,
        }}
        // Menu configuration
        menus={{
          bubble: true,
          table: true,
          image: true,
          video: true,
          callout: true,
          link: true,
          subpages: true,
          excalidraw: true,
          drawio: true,
        }}
        // Search & Replace enabled
        searchReplace={true}
        // Event handlers
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        // Advanced options
        immediatelyRender={true}
        shouldRerenderOnTransaction={false}
        // Custom editor props with paste/drop handlers
        editorProps={{
          scrollThreshold: 80,
          scrollMargin: 80,
          handleDOMEvents: {
            keydown: (_view, event) => {
              // Cmd/Ctrl+S prevention
              if ((event.ctrlKey || event.metaKey) && event.code === "KeyS") {
                event.preventDefault();
                return true;
              }
              // Slash command menu navigation
              if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
                const slashCommand = document.querySelector("#slash-command");
                if (slashCommand) {
                  return true;
                }
              }
              // Emoji command menu navigation
              if (
                [
                  "ArrowUp",
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "Enter",
                ].includes(event.key)
              ) {
                const emojiCommand = document.querySelector("#emoji-command");
                if (emojiCommand) {
                  return true;
                }
              }
              return false;
            },
          },
          handlePaste: (_view, event) => {
            if (!editorRef.current) return false;
            return handlePaste(
              editorRef.current,
              event,
              pageId,
              currentUser?.user.id,
            );
          },
          handleDrop: (_view, event, _slice, moved) => {
            if (!editorRef.current) return false;
            return handleFileDrop(editorRef.current, event, moved, pageId);
          },
        }}
      />
      <div
        onClick={() => editorRef.current?.commands.focus("end")}
        style={{ paddingBottom: "20vh" }}
      ></div>
    </div>
  );
}
