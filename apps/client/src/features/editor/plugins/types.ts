import { Editor, Extension } from "@tiptap/react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IUser } from "@/features/user/types/user.types";
import { IAttachment } from "@/features/attachment/types/attachment.types";
import { RefObject } from "react";

/**
 * Plugin interface for extending BaseEditor functionality
 */
export interface EditorPlugin {
  name: string;
  install: (editor: Editor, config: any) => void;
  uninstall?: (editor: Editor) => void;
  extensions?: Extension[];
  components?: React.ComponentType[];
}

/**
 * Collaboration configuration for Y.js/Hocuspocus
 */
export interface CollaborationConfig {
  documentName: string;
  user: IUser;
  token?: string;
  url?: string;
  provider?: "hocuspocus" | "custom";
  onConnectionStatus?: (status: string) => void;
}

/**
 * Comments configuration
 */
export interface CommentsConfig {
  enabled: boolean;
  pageId?: string;
  onCommentClick?: (commentId: string) => void;
}

/**
 * Upload configuration with abstracted context
 */
export interface UploadConfig {
  onUpload: (file: File, context?: any) => Promise<IAttachment>;
  context?: any; // pageId, spaceId, userId, or any context
  allowedTypes?: string[];
  maxSize?: number;
  enableImages?: boolean;
  enableVideos?: boolean;
  enableAttachments?: boolean;
}

/**
 * Menu configuration
 */
export interface MenuConfig {
  bubble?: boolean;
  table?: boolean;
  image?: boolean;
  video?: boolean;
  callout?: boolean;
  link?: boolean;
  subpages?: boolean;
  excalidraw?: boolean;
  drawio?: boolean;
  appendTo?: RefObject<HTMLElement>;
}

/**
 * Editor presets
 */
export type EditorPreset = "minimal" | "basic" | "full" | "title" | "readonly";

/**
 * Preset configuration
 */
export interface PresetConfig {
  extensions?: Extension[];
  features?: string[];
}
