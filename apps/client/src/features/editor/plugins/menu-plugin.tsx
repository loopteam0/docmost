import React from "react";
import { Editor } from "@tiptap/core";
import { MenuConfig } from "./types";
import { EditorBubbleMenu } from "@/features/editor/components/bubble-menu/bubble-menu";
import TableMenu from "@/features/editor/components/table/table-menu";
import TableCellMenu from "@/features/editor/components/table/table-cell-menu";
import ImageMenu from "@/features/editor/components/image/image-menu";
import VideoMenu from "@/features/editor/components/video/video-menu";
import CalloutMenu from "@/features/editor/components/callout/callout-menu";
import SubpagesMenu from "@/features/editor/components/subpages/subpages-menu";
import ExcalidrawMenu from "@/features/editor/components/excalidraw/excalidraw-menu";
import DrawioMenu from "@/features/editor/components/drawio/drawio-menu";
import LinkMenu from "@/features/editor/components/link/link-menu";

/**
 * Menu Wrapper Component - Conditionally renders menus based on configuration
 */
export function MenuWrapper({
  config,
  editor,
  editorIsEditable,
}: {
  config: MenuConfig | false;
  editor: Editor;
  editorIsEditable: boolean;
}) {
  if (!config || !editorIsEditable) {
    return null;
  }

  const {
    bubble = false,
    table = false,
    image = false,
    video = false,
    callout = false,
    link = false,
    subpages = false,
    excalidraw = false,
    drawio = false,
    appendTo,
  } = config;

  return (
    <>
      {bubble && <EditorBubbleMenu editor={editor} />}
      {table && (
        <>
          <TableMenu editor={editor} />
          <TableCellMenu editor={editor} appendTo={appendTo} />
        </>
      )}
      {image && <ImageMenu editor={editor} />}
      {video && <VideoMenu editor={editor} />}
      {callout && <CalloutMenu editor={editor} />}
      {subpages && <SubpagesMenu editor={editor} />}
      {excalidraw && <ExcalidrawMenu editor={editor} />}
      {drawio && <DrawioMenu editor={editor} />}
      {link && <LinkMenu editor={editor} appendTo={appendTo} />}
    </>
  );
}
