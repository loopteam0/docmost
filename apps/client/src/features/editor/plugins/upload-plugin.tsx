import { Editor } from "@tiptap/core";
import { UploadConfig } from "./types";
import { uploadImageAction } from "@/features/editor/components/image/upload-image-action";
import { uploadVideoAction } from "@/features/editor/components/video/upload-video-action";
import { uploadAttachmentAction } from "@/features/editor/components/attachment/upload-attachment-action";
import { createMentionAction } from "@/features/editor/components/link/internal-link-paste";
import { INTERNAL_LINK_REGEX } from "@/lib/constants";

/**
 * Creates a paste handler with configurable upload functionality
 */
export function createPasteHandler(config: UploadConfig | false, pageId?: string) {
  if (!config) {
    return () => false; // No upload handling
  }

  return (editor: Editor, event: ClipboardEvent, creatorId?: string) => {
    const clipboardData = event.clipboardData?.getData("text/plain") || "";

    // Handle internal link pasting (mention creation)
    if (INTERNAL_LINK_REGEX.test(clipboardData)) {
      event.preventDefault();
      const url = clipboardData.trim();
      const { from: pos, empty } = editor.state.selection;
      const match = INTERNAL_LINK_REGEX.exec(url);
      const currentPageMatch = INTERNAL_LINK_REGEX.exec(window.location.href);

      // pasted link must be from the same workspace/domain and must not be on a selection
      if (!empty || !match || match[2] !== window.location.host) {
        return false;
      }

      // for now, we only support internal links from the same space
      if (currentPageMatch && currentPageMatch[4].toLowerCase() !== match[4].toLowerCase()) {
        return false;
      }

      const anchorId = match[6] ? match[6].split("#")[0] : undefined;
      const urlWithoutAnchor = anchorId
        ? url.substring(0, url.indexOf("#"))
        : url;
      createMentionAction(urlWithoutAnchor, editor.view, pos, creatorId, anchorId);
      return true;
    }

    // Handle file uploads
    if (event.clipboardData?.files.length) {
      event.preventDefault();
      for (const file of event.clipboardData.files) {
        const pos = editor.state.selection.from;

        // Use the context (pageId or other) from config
        const context = config.context || pageId;

        if (config.enableImages !== false) {
          uploadImageAction(file, editor, pos, context);
        }
        if (config.enableVideos !== false) {
          uploadVideoAction(file, editor, pos, context);
        }
        if (config.enableAttachments !== false) {
          uploadAttachmentAction(file, editor, pos, context);
        }
      }
      return true;
    }

    return false;
  };
}

/**
 * Creates a drop handler with configurable upload functionality
 */
export function createDropHandler(config: UploadConfig | false, pageId?: string) {
  if (!config) {
    return () => false; // No upload handling
  }

  return (editor: Editor, event: DragEvent, moved: boolean) => {
    if (!moved && event.dataTransfer?.files.length) {
      event.preventDefault();

      for (const file of event.dataTransfer.files) {
        const coordinates = editor.view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        const pos = coordinates?.pos ?? 0 - 1;

        // Use the context (pageId or other) from config
        const context = config.context || pageId;

        if (config.enableImages !== false) {
          uploadImageAction(file, editor, pos, context);
        }
        if (config.enableVideos !== false) {
          uploadVideoAction(file, editor, pos, context);
        }
        if (config.enableAttachments !== false) {
          uploadAttachmentAction(file, editor, pos, context);
        }
      }
      return true;
    }
    return false;
  };
}

/**
 * Configures upload handlers for editor
 */
export function setupUploadHandlers(
  editor: Editor,
  config: UploadConfig | false,
  pageId?: string,
  creatorId?: string,
) {
  if (!config) return;

  const pasteHandler = createPasteHandler(config, pageId);
  const dropHandler = createDropHandler(config, pageId);

  // Store handlers in editor for later use
  (editor as any)._uploadPasteHandler = (view: any, event: ClipboardEvent) => {
    return pasteHandler(editor, event, creatorId);
  };

  (editor as any)._uploadDropHandler = (
    view: any,
    event: DragEvent,
    slice: any,
    moved: boolean,
  ) => {
    return dropHandler(editor, event, moved);
  };
}
