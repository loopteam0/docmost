import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface OpenApiOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export type OpenApiSourceType = "attachment" | "url";

export interface OpenApiAttributes {
  sourceType?: OpenApiSourceType;
  attachmentId?: string;
  src?: string;
  fileName?: string;
  url?: string;
  title?: string;
  height?: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    openapi: {
      setOpenApi: (attributes?: OpenApiAttributes) => ReturnType;
    };
  }
}

export const OpenApi = Node.create<OpenApiOptions>({
  name: "openapi",
  inline: false,
  group: "block",
  isolating: true,
  atom: true,
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      view: null,
    };
  },

  addAttributes() {
    return {
      sourceType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-source-type"),
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-source-type": attributes.sourceType,
        }),
      },
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src"),
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-src": attributes.src,
        }),
      },
      fileName: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-file-name"),
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-file-name": attributes.fileName,
        }),
      },
      url: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-url"),
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-url": attributes.url,
        }),
      },
      title: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-title": attributes.title,
        }),
      },
      height: {
        default: 600,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-height");
          if (!raw) return 600;
          const num = parseFloat(raw);
          return isNaN(num) ? 600 : num;
        },
        renderHTML: (attributes: OpenApiAttributes) => ({
          "data-height": attributes.height,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const title = HTMLAttributes["data-title"] || "OpenAPI specification";
    const href = HTMLAttributes["data-url"] || HTMLAttributes["data-src"] || "";

    return [
      "div",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      ["a", { href, target: "_blank" }, `📄 ${title}`],
    ];
  },

  addCommands() {
    return {
      setOpenApi:
        (attrs?: OpenApiAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "openapi",
            attrs: attrs,
          });
        },
    };
  },

  addNodeView() {
    this.editor.isInitialized = true;
    return ReactNodeViewRenderer(this.options.view);
  },
});
