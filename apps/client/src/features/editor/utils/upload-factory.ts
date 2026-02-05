import { IAttachment } from "@/features/attachment/types/attachment.types";
import { UploadConfig } from "@/features/editor/plugins/types";

/**
 * Factory for creating upload handlers
 */
export interface UploadHandler {
  (file: File, context?: any): Promise<IAttachment>;
}

/**
 * Creates an upload handler from upload configuration
 */
export function createUploadHandler(
  config: UploadConfig,
): UploadHandler {
  return async (file: File, context?: any) => {
    const uploadContext = context || config.context;
    return await config.onUpload(file, uploadContext);
  };
}

/**
 * Creates a page-specific upload handler (for backward compatibility)
 */
export function createPageUploadHandler(
  uploadFn: (file: File, pageId: string) => Promise<IAttachment>,
  pageId: string,
): UploadHandler {
  return async (file: File) => {
    return await uploadFn(file, pageId);
  };
}
