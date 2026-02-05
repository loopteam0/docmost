/**
 * Converts plain text to TipTap JSON format
 */
export function textToTiptapJSON(text: string): any {
  if (!text || text.trim() === "") {
    return {
      type: "doc",
      content: [],
    };
  }

  // Split by newlines and create paragraphs
  const paragraphs = text.split("\n").map((line) => ({
    type: "paragraph",
    content: line.trim()
      ? [
          {
            type: "text",
            text: line,
          },
        ]
      : [],
  }));

  return {
    type: "doc",
    content: paragraphs,
  };
}

/**
 * Converts TipTap JSON to plain text
 */
export function tiptapJSONToText(json: any): string {
  if (!json || !json.content) {
    return "";
  }

  const extractText = (node: any): string => {
    if (node.type === "text") {
      return node.text || "";
    }

    if (node.type === "hardBreak") {
      return "\n";
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join("");
    }

    return "";
  };

  // Extract text from all nodes and join paragraphs with newlines
  const text = json.content
    .map((node: any) => {
      if (node.type === "paragraph") {
        return extractText(node);
      }
      if (node.type === "heading") {
        return extractText(node);
      }
      if (node.type === "bulletList" || node.type === "orderedList") {
        return extractText(node);
      }
      return extractText(node);
    })
    .join("\n");

  return text;
}
