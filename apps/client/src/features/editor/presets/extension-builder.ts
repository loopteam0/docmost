import { Extension } from "@tiptap/react";
import { EditorPreset } from "@/features/editor/plugins/types";
import { getPresetExtensions } from "./editor-presets";

/**
 * Options for building extensions
 */
export interface ExtensionBuilderOptions {
  preset?: EditorPreset;
  customExtensions?: Extension[];
  excludeExtensions?: string[]; // Extension names to exclude
  includeExtensions?: Extension[]; // Additional extensions to include
}

/**
 * Builds an array of TipTap extensions based on preset and custom configuration
 *
 * @param options - Configuration options for building extensions
 * @returns Array of configured TipTap extensions
 *
 * @example
 * // Use a preset as-is
 * const extensions = buildExtensions({ preset: 'basic' });
 *
 * @example
 * // Use preset and add custom extensions
 * const extensions = buildExtensions({
 *   preset: 'basic',
 *   customExtensions: [MyCustomExtension]
 * });
 *
 * @example
 * // Use preset but exclude certain extensions
 * const extensions = buildExtensions({
 *   preset: 'full',
 *   excludeExtensions: ['comment', 'mention']
 * });
 */
export function buildExtensions(
  options: ExtensionBuilderOptions = {},
): Extension[] {
  const {
    preset = "full",
    customExtensions = [],
    excludeExtensions = [],
    includeExtensions = [],
  } = options;

  // Start with preset extensions
  let extensions = getPresetExtensions(preset);

  // Filter out excluded extensions
  if (excludeExtensions.length > 0) {
    extensions = extensions.filter(
      (ext: any) => !excludeExtensions.includes(ext.name),
    );
  }

  // Add additional extensions
  if (includeExtensions.length > 0) {
    extensions = [...extensions, ...includeExtensions];
  }

  // Merge custom extensions
  // Custom extensions override preset extensions with the same name
  if (customExtensions.length > 0) {
    const customExtensionNames = customExtensions.map((ext: any) => ext.name);

    // Remove preset extensions that are being overridden
    extensions = extensions.filter(
      (ext: any) => !customExtensionNames.includes(ext.name),
    );

    // Add custom extensions
    extensions = [...extensions, ...customExtensions];
  }

  return extensions;
}

/**
 * Creates a simple preset with only specified extensions
 */
export function createSimplePreset(extensions: Extension[]): Extension[] {
  return extensions;
}
