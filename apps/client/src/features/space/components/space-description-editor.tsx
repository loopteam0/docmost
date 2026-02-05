import React, { useMemo } from "react";
import { useDebouncedCallback } from "@mantine/hooks";
import { BaseEditor } from "@/features/editor/base-editor";
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
 * Uses BaseEditor with "basic" preset for essential formatting (bold, italic, lists, links)
 * without complex features like collaboration, comments, or file uploads.
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
    return initialContent;
  }, [value, initialContent]);

  // Debounced save handler (auto-save after 2 seconds of inactivity)
  const debouncedSave = useDebouncedCallback((content: any) => {
    if (onSave) {
      onSave(content);
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

  return (
    <BaseEditor
      preset="basic"
      defaultContent={content}
      editable={editable}
      placeholder={placeholder}
      // No collaboration needed for space descriptions
      collaboration={false}
      // No comments needed
      comments={false}
      // No file uploads needed (can enable if needed)
      uploads={false}
      // Enable basic menus
      menus={{
        bubble: true, // Text formatting menu
        link: true, // Link menu
      }}
      // Disable search & replace (not needed for short descriptions)
      searchReplace={false}
      // Handle updates
      onUpdate={handleUpdate}
      // Styling
      className="space-description-editor"
    />
  );
};

export default SpaceDescriptionEditor;
