// src/components/markdownParser.ts

import type { Resolution, ResolutionMetadata } from "./types";
import type jsPDF from "jspdf";

export function parseMarkdown(markdownText: string): Resolution {
  const { metadata, content } = extractFrontMatter(markdownText);

  return {
    metadata,
    content: content,
  };
}

function extractFrontMatter(text: string): {
  metadata: ResolutionMetadata;
  content: string;
} {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = text.match(frontMatterRegex);

  if (!match) {
    throw new Error("Invalid markdown format - missing frontmatter");
  }

  const [, frontMatter, content] = match;
  const metadata = parseFrontMatter(frontMatter);

  return { metadata, content };
}

function parseFrontMatter(frontMatter: string): ResolutionMetadata {
  const lines = frontMatter.split("\n");
  const metadata: Partial<ResolutionMetadata> = {};

  lines.forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      const value = valueParts.join(":").trim();
      metadata[key.trim() as keyof ResolutionMetadata] = value;
    }
  });

  return metadata as ResolutionMetadata;
}

/**
 * Represents a parsed segment of text with its content and style.
 */
interface TextSegment {
  content: string;
  style: "normal" | "bold" | "italic" | "bolditalic";
}

/**
 * Parses a markdown string into an array of TextSegment objects.
 * This is a helper function for renderMarkdownParagraph.
 *
 * @param markdownText The input markdown string.
 * @returns An array of TextSegment objects.
 */
function parseMarkdownToSegments(markdownText: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Regex to find segments: order matters for nested patterns!
  const regex =
    /(\*\*\*([^*]+?)\*\*\*)|(\*\*([^*]+?)\*\*)|(\*([^*]+?)\*)|(__([^_]+?)__)|(_([^_]+?)_)|([^_*]+)/g;

  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(markdownText)) !== null) {
    // If there's plain text before the current match
    if (match.index > lastIndex) {
      segments.push({
        content: markdownText.substring(lastIndex, match.index),
        style: "normal",
      });
    }

    let segmentText: string = "";
    let fontStyle: "normal" | "bold" | "italic" | "bolditalic" = "normal";

    if (match[1]) {
      // ***text***
      segmentText = match[2];
      fontStyle = "bolditalic";
    } else if (match[3]) {
      // **text**
      segmentText = match[4];
      fontStyle = "bold";
    } else if (match[5]) {
      // *text*
      segmentText = match[6];
      fontStyle = "italic";
    } else if (match[7]) {
      // __text__
      segmentText = match[8];
      fontStyle = "bold";
    } else if (match[9]) {
      // _text_
      segmentText = match[10];
      fontStyle = "italic";
    } else if (match[11]) {
      // Plain text (this should catch remaining text if regex fails)
      segmentText = match[11];
      fontStyle = "normal";
    } else {
      // This case should ideally not be reached if regex is comprehensive
      console.warn("Unexpected match in markdown parsing:", match);
      continue;
    }

    if (segmentText) {
      // Ensure segment text is not empty
      segments.push({
        content: segmentText,
        style: fontStyle,
      });
    }
    lastIndex = regex.lastIndex;
  }

  // Add any remaining plain text after the last match
  if (lastIndex < markdownText.length) {
    segments.push({
      content: markdownText.substring(lastIndex),
      style: "normal",
    });
  }

  return segments;
}

/**
 * Renders a Markdown-formatted paragraph to a jsPDF document with line wrapping.
 *
 * @param {IJsPDF} doc - The jsPDF document instance.
 * @param {string} markdownText - The Markdown-formatted paragraph text.
 * @param {number} startX - The starting X-coordinate for the paragraph.
 * @param {number} startY - The starting Y-coordinate for the paragraph.
 * @param {number} maxWidth - The maximum width for the paragraph before wrapping.
 * @param {number} fontSize - The font size for the text.
 * @param {number} lineHeightMultiplier - Multiplier for line height (e.g., 1.2 for 120% line height).
 * @param {number} [bottomMargin=10] - The bottom margin before adding a new page.
 * @returns {number} The Y-coordinate where the paragraph rendering ended.
 */
export function renderMarkdownParagraph(
  doc: jsPDF,
  markdownText: string,
  startX: number,
  startY: number,
  maxWidth: number,
  fontSize: number,
  lineHeightMultiplier: number = 1,
  bottomMargin: number = 0 // Default bottom margin for new page check
): number {
  let currentY: number = startY;
  const originalFontFamily: string = "helvetica";
  const lineHeight: number = fontSize * lineHeightMultiplier;
  const pageHeight: number = doc.internal.pageSize.getHeight();

  const segments: TextSegment[] = parseMarkdownToSegments(markdownText);

  let currentLineWords: TextSegment[] = [];
  let currentLineWidth: number = 0;

  console.log(currentY);
  for (const segment of segments) {
    // Split segments into words to handle wrapping at word boundaries
    const words = segment.content.split(/(\s+)/); // Split by whitespace, keeping whitespace as a separate element

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.length === 0) continue; // Skip empty strings from split

      // Temporarily set font to measure word width accurately
      doc.setFont(originalFontFamily, segment.style);
      const wordWidth =
        (doc.getStringUnitWidth(word) * fontSize) / doc.internal.scaleFactor;

      // Check if adding this word would exceed maxWidth
      // If it's the very first word on a line and it's longer than maxWidth, we still draw it.
      // Or if current line is empty OR if adding this word + current line width exceeds maxWidth
      if (
        currentLineWords.length > 0 &&
        currentLineWidth + wordWidth > maxWidth
      ) {
        // Render the current line accumulated

        let drawX = startX;
        for (const lw of currentLineWords) {
          doc.setFont(originalFontFamily, lw.style);
          doc.text(lw.content, drawX, currentY);
          drawX +=
            (doc.getStringUnitWidth(lw.content) * fontSize) /
            doc.internal.scaleFactor;
        }

        // Move to the next line
        console.log("lineHight: ", lineHeight);
        currentY += lineHeight;

        currentLineWords = [];
        currentLineWidth = 0;

        // Check for page overflow
        if (currentY > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = startY; // Reset Y for the new page (assuming similar top margin)
        }
      }

      // Add the current word to the line buffer
      currentLineWords.push({ content: word, style: segment.style });
      currentLineWidth += wordWidth;
    }
  }
  console.log(currentY);

  // Render any remaining words in the buffer
  if (currentLineWords.length > 0) {
    let drawX = startX;
    for (const lw of currentLineWords) {
      doc.setFont(originalFontFamily, lw.style);
      doc.text(lw.content, drawX, currentY);
      drawX +=
        (doc.getStringUnitWidth(lw.content) * fontSize) /
        doc.internal.scaleFactor;
    }
    currentY += lineHeight; // Move Y after the last line
  }
  console.log(currentY);
  // Restore default font
  doc.setFont(originalFontFamily, "normal");

  return currentY; // Return the final Y position
}
