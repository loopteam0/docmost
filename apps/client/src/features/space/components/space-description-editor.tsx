import React, { useEffect, useMemo } from "react";
import { useDebouncedCallback } from "@mantine/hooks";
import { EditorContent, useEditor } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Bold } from "@tiptap/extension-bold";
import { Italic } from "@tiptap/extension-italic";
import { Strike } from "@tiptap/extension-strike";
import { Link } from "@tiptap/extension-link";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { ListItem } from "@tiptap/extension-list-item";
import { Placeholder } from "@tiptap/extension-placeholder";
import { History } from "@tiptap/extension-history";
import {
  textToTiptapJSON,
  tiptapJSONToText,
} from "@/features/editor/utils/text-conversion";

interface SpaceDescriptionEditorProps {
  spaceId?: string;
  value?: string; // Plain text value (for form integration)
  onChange?: (text: string) => void; // Plain text onChange (for form integration)
  initialContent?: any; // TipTap JSON (alternative to value)
  onSave?: (content: any) => void; // TipTap JSON save
  editable?: boolean;
  placeholder?: string;
}

/**
 * Space Description Editor - A simple rich text editor for space descriptions
 *
 * Provides essential formatting (bold, italic, lists, links) without complex
 * features like collaboration, comments, or file uploads.
 *
 * Supports both plain text (for form integration) and TipTap JSON formats.
 *
 * @example
 * // With plain text (form integration)
 * <SpaceDescriptionEditor
 *   value={formValue}
 *   onChange={(text) => form.setFieldValue('description', text)}
 * />
 *
 * @example
 * // With TipTap JSON
 * <SpaceDescriptionEditor
 *   initialContent={space.description}
 *   onSave={(content) => updateSpaceDescription(space.id, content)}
 * />
 */
export const SpaceDescriptionEditor: React.FC<SpaceDescriptionEditorProps> = ({
  spaceId,
  value,
  onChange,
  initialContent,
  onSave,
  editable = true,
  placeholder = "Describe your space...",
}) => {
  // Convert plain text to TipTap JSON if using value prop
  const content = useMemo(() => {
    if (value !== undefined) {
      return textToTiptapJSON(value);
    }
    if (typeof initialContent === "string") {
      return textToTiptapJSON(initialContent);
    }
    return initialContent;
  }, [value, initialContent]);

  // Debounced save handler (auto-save after 2 seconds of inactivity)
  const debouncedSave = useDebouncedCallback((newContent: any) => {
    if (onSave) {
      onSave(newContent);
    }
  }, 2000);

  // Handle updates - convert to plain text if onChange is provided
  const handleUpdate = (newContent: any) => {
    if (onChange) {
      const plainText = tiptapJSONToText(newContent);
      onChange(plainText);
    } else if (onSave) {
      debouncedSave(newContent);
    }
  };

  const editor = useEditor(
    {
      extensions: [
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        Strike,
        Link.configure({ openOnClick: false }),
        BulletList,
        OrderedList,
        ListItem,
        History,
        Placeholder.configure({
          placeholder,
          showOnlyWhenEditable: true,
        }),
      ],
      content: content,
      editable,
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      onUpdate({ editor }) {
        handleUpdate(editor.getJSON());
      },
    },
    [spaceId],
  );

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-description-editor">
      <EditorContent editor={editor} />
    </div>
  );
};

export default SpaceDescriptionEditor;
