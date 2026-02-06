import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor, EditorContent, EditorOptions, useEditor, useEditorState } from "@tiptap/react";
import {
  EditorPreset,
  CollaborationConfig,
  CommentsConfig,
  UploadConfig,
  MenuConfig,
} from "@/features/editor/plugins/types";
import { buildExtensions } from "@/features/editor/presets/extension-builder";
import { Extension } from "@tiptap/core";
import {
  createCollaborationProviders,
  destroyCollaborationProviders,
  createCollaborationExtensions,
  CollaborationProviders,
} from "@/features/editor/plugins/collaboration-plugin";
import { createPasteHandler, createDropHandler } from "@/features/editor/plugins/upload-plugin";
import { setupCommentListeners } from "@/features/editor/plugins/comments-plugin";
import { MenuWrapper } from "@/features/editor/plugins/menu-plugin";
import SearchAndReplaceDialog from "@/features/editor/components/search-and-replace/search-and-replace-dialog";
import CommentDialog from "@/features/comment/components/comment-dialog";
import { useAtom } from "jotai";
import { showCommentPopupAtom } from "@/features/comment/atoms/comment-atom";

/**
 * Base Editor Props Interface
 */
export interface BaseEditorProps {
  // Content & State
  content?: any;
  defaultContent?: any;
  editable?: boolean;

  // Preset Configuration
  preset?: EditorPreset;
  customExtensions?: Extension[];
  excludeExtensions?: string[];

  // Optional Features (Plugins)
  collaboration?: CollaborationConfig | false;
  comments?: CommentsConfig | false;
  uploads?: UploadConfig | false;
  menus?: MenuConfig | false;
  searchReplace?: boolean;

  // Event Handlers
  onCreate?: (editor: Editor) => void;
  onUpdate?: (content: any, editor: Editor) => void;
  onSave?: (content: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onDestroy?: () => void;

  // Styling & Container
  className?: string;
  containerRef?: RefObject<HTMLDivElement>;
  placeholder?: string;

  // Keyboard Shortcuts
  keyboardShortcuts?: Record<string, () => boolean>;

  // Editor Props passthrough
  editorProps?: Partial<EditorOptions["editorProps"]>;

  // Advanced Options
  immediatelyRender?: boolean;
  shouldRerenderOnTransaction?: boolean;
  autofocus?: boolean | "start" | "end" | number;
}

/**
 * BaseEditor - Generic, reusable TipTap editor component
 *
 * A flexible editor component that can be configured with different presets
 * and optional features (collaboration, comments, uploads, menus).
 *
 * @example
 * // Minimal editor
 * <BaseEditor preset="minimal" placeholder="Enter text..." />
 *
 * @example
 * // Basic editor with formatting
 * <BaseEditor
 *   preset="basic"
 *   content={content}
 *   onUpdate={(content) => console.log(content)}
 * />
 *
 * @example
 * // Full editor with all features (via PageEditor wrapper)
 * <BaseEditor
 *   preset="full"
 *   collaboration={{ documentName: 'doc-1', user }}
 *   uploads={{ onUpload: uploadFn }}
 *   menus={{ bubble: true, table: true }}
 * />
 */
export const BaseEditor: React.FC<BaseEditorProps> = ({
  content,
  defaultContent,
  editable = true,
  preset = "full",
  customExtensions = [],
  excludeExtensions = [],
  collaboration = false,
  comments = false,
  uploads = false,
  menus = false,
  searchReplace = true,
  onCreate,
  onUpdate,
  onSave,
  onBlur,
  onFocus,
  onDestroy,
  className,
  containerRef,
  placeholder,
  keyboardShortcuts = {},
  editorProps = {},
  immediatelyRender = true,
  shouldRerenderOnTransaction = false,
  autofocus = false,
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [showCommentPopup] = useAtom(showCommentPopupAtom);
  const [collaborationProviders, setCollaborationProviders] =
    useState<CollaborationProviders | null>(null);
  const [collaborationReady, setCollaborationReady] = useState(!collaboration);

  // Setup collaboration providers
  useEffect(() => {
    if (!collaboration) {
      setCollaborationReady(true);
      return;
    }

    const providers = createCollaborationProviders(
      collaboration,
      {
        onLocalSynced: () => {
          // Local sync completed
        },
        onRemoteSynced: (synced: boolean) => {
          if (synced) {
            setCollaborationReady(true);
          }
        },
        onConnectionStatus: (status: string) => {
          if (collaboration.onConnectionStatus) {
            collaboration.onConnectionStatus(status);
          }
        },
        onAuthenticationFailed: () => {
          // Handle auth failure
        },
      },
    );

    setCollaborationProviders(providers);
    providers.remote.attach();

    return () => {
      destroyCollaborationProviders(providers);
      setCollaborationProviders(null);
    };
  }, [collaboration ? collaboration.documentName : null]);

  // Build extensions based on preset and options
  const extensions = useMemo(() => {
    let baseExtensions = buildExtensions({
      preset,
      customExtensions,
      excludeExtensions,
    });

    // Add collaboration extensions if enabled and ready
    if (collaboration && collaborationProviders && collaborationReady) {
      const collabExts = createCollaborationExtensions(
        collaborationProviders.remote,
        collaboration,
      );
      baseExtensions = [...baseExtensions, ...collabExts];
    }

    return baseExtensions;
  }, [preset, customExtensions, excludeExtensions, collaboration, collaborationProviders, collaborationReady]);

  // Create upload handlers
  const handlePaste = useMemo(() => {
    return createPasteHandler(uploads);
  }, [uploads]);

  const handleDrop = useMemo(() => {
    return createDropHandler(uploads);
  }, [uploads]);

  // Merge default keyboard shortcuts with custom ones
  const handleKeyDown = useCallback(
    (_view: any, event: KeyboardEvent) => {
      // Custom keyboard shortcuts
      const key = `${event.ctrlKey || event.metaKey ? "Mod-" : ""}${event.key}`;
      if (keyboardShortcuts[key]) {
        const handled = keyboardShortcuts[key]();
        if (handled) {
          event.preventDefault();
          return true;
        }
      }

      // Default shortcuts
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (onSave && editor) {
          onSave(editor.getJSON());
        }
        return true;
      }

      return false;
    },
    [keyboardShortcuts, onSave],
  );

  // Create editor instance
  const editor = useEditor(
    {
      extensions,
      content: content || defaultContent,
      editable,
      immediatelyRender,
      shouldRerenderOnTransaction,
      autofocus,
      editorProps: {
        ...editorProps,
        handleDOMEvents: {
          keydown: handleKeyDown,
          ...editorProps.handleDOMEvents,
        },
        handlePaste: uploads ? (view, event) => handlePaste(editor!, event) : editorProps.handlePaste,
        handleDrop: uploads ? (view, event, slice, moved) => handleDrop(editor!, event, moved) : editorProps.handleDrop,
      },
      onCreate({ editor }) {
        if (onCreate) {
          onCreate(editor);
        }
      },
      onUpdate({ editor }) {
        if (onUpdate) {
          onUpdate(editor.getJSON(), editor);
        }
      },
      onBlur() {
        if (onBlur) {
          onBlur();
        }
      },
      onFocus() {
        if (onFocus) {
          onFocus();
        }
      },
      onDestroy() {
        if (onDestroy) {
          onDestroy();
        }
      },
    },
    [preset, extensions], // Recreate if preset or extensions change
  );

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getJSON();
      // Only update if content actually changed
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  // Update editor editability when editable prop changes
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Get editor editable state for conditional rendering
  const editorIsEditable = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isEditable ?? false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div ref={containerRef || menuContainerRef} className={className}>
      <EditorContent editor={editor} />

      {/* Search & Replace Dialog */}
      {searchReplace && editor && (
        <SearchAndReplaceDialog editor={editor} editable={editable} />
      )}

      {/* Menu Components */}
      {menus && (
        <MenuWrapper
          config={menus}
          editor={editor}
          editorIsEditable={editorIsEditable}
        />
      )}

      {/* Comment Dialog */}
      {showCommentPopup && comments && (
        <CommentDialog
          editor={editor}
          pageId={comments && typeof comments === "object" ? comments.pageId : undefined}
        />
      )}
    </div>
  );
};

export default BaseEditor;
