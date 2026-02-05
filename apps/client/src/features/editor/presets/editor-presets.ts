import { Extension } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@docmost/editor-ext";
import { mainExtensions } from "@/features/editor/extensions/extensions";
import { EditorPreset } from "@/features/editor/plugins/types";
import i18n from "@/i18n";

/**
 * Minimal preset - Plain text editing only
 * Use case: Simple text input fields
 */
export const minimalPreset: Extension[] = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
  Placeholder.configure({
    placeholder: i18n.t("Enter text..."),
  }),
];

/**
 * Basic preset - Essential rich text formatting
 * Use case: Space descriptions, user bios, simple comments
 */
export const basicPreset: Extension[] = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    codeBlock: false,
    dropcursor: {
      width: 3,
      color: "#70CFF8",
    },
  }),
  Placeholder.configure({
    placeholder: i18n.t("Write something..."),
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Underline,
  Highlight.configure({
    multicolor: false,
  }),
];

/**
 * Title preset - For page titles
 * Use case: Page title editor
 */
export const titlePreset: Extension[] = [
  StarterKit.configure({
    heading: {
      levels: [1],
    },
    paragraph: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    dropcursor: false,
  }),
  Placeholder.configure({
    placeholder: i18n.t("Untitled"),
  }),
];

/**
 * Full preset - All editing features
 * Use case: Full page editor with all bells and whistles
 * Note: Collaboration extensions added separately via plugin
 */
export const fullPreset: Extension[] = [...mainExtensions];

/**
 * Readonly preset - Display-only mode
 * Use case: Viewing page history, read-only documents
 */
export const readonlyPreset: Extension[] = [
  ...mainExtensions.filter((ext: any) => ext.name !== "uniqueID"),
];

/**
 * Preset registry mapping preset names to extensions
 */
export const presetRegistry: Record<EditorPreset, Extension[]> = {
  minimal: minimalPreset,
  basic: basicPreset,
  title: titlePreset,
  full: fullPreset,
  readonly: readonlyPreset,
};

/**
 * Get extensions for a given preset
 */
export function getPresetExtensions(preset: EditorPreset): Extension[] {
  return presetRegistry[preset] || fullPreset;
}
