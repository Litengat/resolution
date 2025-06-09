// src/components/pdfRenderer.ts
import jsPDF from "jspdf";
import type { ResolutionMetadata } from "./types";
import { convertSvgToBase64 } from "./ImageLoader";
import { committees, defaultCommittee } from "./committees"; // Importieren
import { renderMarkdownParagraph } from "./MarkdownParser";

let cachedIconBase64: string = "";

export async function createPdfDocument(
  metadata: ResolutionMetadata,
  content: string
): Promise<jsPDF> {
  // ... (Code bleibt gleich bis zum Header)

  console.log(content);
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  let currentY = margin;
  const lineHeight = 5;

  if (!cachedIconBase64) {
    try {
      cachedIconBase64 = await convertSvgToBase64("/Spun.png");
    } catch (error) {
      console.error("Error loading icon for PDF:", error);
    }
  }

  currentY = addHeader(
    pdf,
    metadata,
    cachedIconBase64,
    pageWidth,
    margin,
    currentY,
    lineHeight
  );

  addContent(pdf, content, pageWidth, pageHeight, margin, currentY, lineHeight);

  return pdf;
}

function addHeader(
  pdf: jsPDF,
  metadata: ResolutionMetadata,
  iconBase64: string,
  pageWidth: number,
  margin: number,
  currentY: number,
  lineHeight: number
): number {
  const committeeInfo = committees[metadata.Ausschuss] || defaultCommittee;

  const currentYear = new Date().getFullYear();
  const documentNumber = Math.floor(Math.random() * 1000) + 100;

  // Header top line
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Vereinte Nationen", margin, currentY);
  pdf.setFontSize(16);
  pdf.text(`S/${currentYear}/${documentNumber}`, pageWidth - margin, currentY, {
    align: "right",
  });
  currentY += 15;

  // --- START: Hybride Skalierungs- und Umbruchlogik ---

  const maxCommitteeNameWidth = pageWidth - margin * 2 - 20 - 45;
  const minReadableFontSize = 14; // Schwellenwert für den Zeilenumbruch
  let committeeFontSize = 24;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(committeeFontSize);

  while (
    pdf.getTextWidth(committeeInfo.name) > maxCommitteeNameWidth &&
    committeeFontSize > 8
  ) {
    committeeFontSize--;
    pdf.setFontSize(committeeFontSize);
  }

  // UN Logo
  const logoX = margin + 8;
  const logoY = currentY - 3;
  pdf.circle(logoX, logoY, 8);
  if (iconBase64) {
    try {
      pdf.addImage(iconBase64, "PNG", logoX - 6, logoY - 6, 12, 12);
    } catch (e) {
      /* ... */
    }
  } else {
    /* ... */
  }

  // Entscheide, ob skaliert oder umgebrochen wird

  if (committeeFontSize < minReadableFontSize) {
    // Schriftgröße wäre zu klein -> Umbruch
    const lines = splitIntoTwoLines(committeeInfo.name);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18); // Größere, lesbare Schrift für zwei Zeilen
    pdf.text(lines, margin + 20, currentY - lineHeight + 1);
    // Zusätzlichen vertikalen Platz für die zweite Zeile vormerken
  } else {
    // Skalierte Schriftgröße ist akzeptabel -> Einzeilig
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(committeeFontSize);
    pdf.text(committeeInfo.name, margin + 20, currentY);
  }

  // --- END: Hybride Logik ---

  // Distribution info on the right
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const formattedDate = formatDate(metadata.Datum);
  pdf.text("Verteilung: Allgemein", pageWidth - margin, currentY - 8, {
    align: "right",
  });
  pdf.text(formattedDate, pageWidth - margin, currentY - 3, {
    align: "right",
  });

  // Vertikalen Versatz für den nächsten Block anwenden
  currentY += 10;

  // Horizontal line
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // ... (Rest der Funktion bleibt unverändert)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  const countriesText = `${metadata.Lander}: ${metadata.Typ}`;
  const countriesLines = splitTextToLines(
    pdf,
    countriesText,
    pageWidth - 2 * margin
  );
  countriesLines.forEach((line) => {
    pdf.text(line, margin, currentY);
    currentY += lineHeight + 1;
  });
  currentY += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  const titleLines = splitTextToLines(
    pdf,
    metadata.title,
    pageWidth - 2 * margin
  );
  titleLines.forEach((line) => {
    pdf.text(line, pageWidth / 2, currentY, { align: "center" });
    currentY += lineHeight + 3;
  });
  currentY += 15;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(12);
  pdf.text(`${committeeInfo.article} ${committeeInfo.name},`, margin, currentY);
  currentY += 15;

  return currentY;
}

function addContent(
  pdf: jsPDF,
  content: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  startY: number,
  lineHeight: number
): void {
  let currentY = startY;

  const sections = parseContent(content);
  console.log(sections);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  sections.forEach((section) => {
    if (currentY > pageHeight - margin - 30) {
      pdf.addPage();
      currentY = margin;
    }

    currentY = addSection(
      pdf,
      section,
      pageWidth,
      pageHeight,
      margin,
      currentY,
      lineHeight
    );
  });
}

function parseContent(
  text: string
): Array<{ type: string; content: string; level?: number }> {
  const lines = text.split("\n");
  const sections: Array<{ type: string; content: string; level?: number }> = [];
  console.log(text);
  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      sections.push({
        type: "heading",
        content: trimmed.replace("## ", ""),
        level: 2,
      });
    } else if (trimmed.startsWith("# ")) {
      sections.push({
        type: "heading",
        content: trimmed.replace("# ", ""),
        level: 1,
      });
    } else if (trimmed.startsWith("**") && trimmed.includes("**,")) {
      sections.push({
        type: "preambular",
        content: trimmed,
      });
    } else if (trimmed.match(/^\d+\./)) {
      sections.push({
        type: "operative",
        content: trimmed,
      });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      sections.push({
        type: "bullet",
        content: trimmed.replace(/^[-*] /, ""),
      });
    } else if (trimmed.length === 0) {
      sections.push({
        type: "empty",
        content: "",
      });
    } else if (trimmed.length > 0) {
      sections.push({
        type: "paragraph",
        content: trimmed,
      });
    }
  });

  return sections;
}

function addSection(
  pdf: jsPDF,
  section: { type: string; content: string; level?: number },
  pageWidth: number,
  pageHeight: number,
  margin: number,
  currentY: number,
  lineHeight: number
): number {
  const maxWidth = pageWidth - 2 * margin;

  switch (section.type) {
    case "heading":
      currentY += 8;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(section.level === 1 ? 16 : 14);

      const headingLines = splitTextToLines(pdf, section.content, maxWidth);
      headingLines.forEach((line) => {
        if (currentY > pageHeight - margin - 20) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += lineHeight + 2;
      });
      currentY += 5;
      break;

    case "preambular":
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);

      const preambularText = formatText(section.content);
      const preambularLines = splitTextToLines(pdf, preambularText, maxWidth);

      preambularLines.forEach((line, index) => {
        if (currentY > pageHeight - margin - 15) {
          pdf.addPage();
          currentY = margin;
        }

        const xPos = index === 0 ? margin : margin + 10;
        pdf.text(line, xPos, currentY);
        currentY += lineHeight + 1;
      });
      currentY += 3;
      break;

    case "operative":
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);

      currentY = renderMarkdownParagraph(
        pdf,
        section.content,
        margin,
        currentY,
        maxWidth,
        12,
        0.5
      );
      // const operativeText = formatText(section.content);
      // const operativeLines = splitTextToLines(
      //   pdf,
      //   operativeText,
      //   maxWidth - 10
      // );

      // operativeLines.forEach((line, index) => {
      //   if (currentY > pageHeight - margin - 15) {
      //     pdf.addPage();
      //     currentY = margin;
      //   }

      //   const xPos = index === 0 ? margin : margin + 15;
      //   pdf.text(line, xPos, currentY);
      //   currentY += lineHeight + 1;
      // });
      // currentY += 3;
      break;

    case "bullet":
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);

      const bulletText = `• ${section.content}`;
      const bulletLines = splitTextToLines(pdf, bulletText, maxWidth - 15);
      bulletLines.forEach((line, index) => {
        if (currentY > pageHeight - margin - 15) {
          pdf.addPage();
          currentY = margin;
        }

        const xPos = index === 0 ? margin + 10 : margin + 15;
        pdf.text(line, xPos, currentY);
        currentY += lineHeight + 1;
      });
      break;

    case "empty":
      currentY += lineHeight;
      break;

    default:
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);

      currentY = renderMarkdownParagraph(
        pdf,
        section.content,
        margin,
        currentY,
        maxWidth,
        12,
        0.5
      );

      break;
  }

  return currentY;
}

function formatText(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

function splitTextToLines(
  pdf: jsPDF,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = pdf.getTextWidth(testLine);

    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Teilt einen String an einem Leerzeichen in zwei möglichst gleich lange Zeilen.
 * @param text Der zu teilende Text.
 * @returns Ein Array mit zwei Strings (Zeilen).
 */
function splitIntoTwoLines(text: string): [string, string] {
  const middle = Math.floor(text.length / 2);
  const before = text.lastIndexOf(" ", middle);
  const after = text.indexOf(" ", middle + 1);

  let breakPoint: number;

  // Finde den besten Umbruchpunkt (das Leerzeichen, das am nächsten zur Mitte ist)
  if (before === -1) {
    breakPoint = after;
  } else if (after === -1) {
    breakPoint = before;
  } else {
    breakPoint = middle - before < after - middle ? before : after;
  }

  if (breakPoint === -1) {
    // Fallback, falls kein Leerzeichen gefunden wird (sehr unwahrscheinlich)
    return [text, ""];
  }

  const line1 = text.substring(0, breakPoint);
  const line2 = text.substring(breakPoint + 1);

  return [line1, line2];
}
