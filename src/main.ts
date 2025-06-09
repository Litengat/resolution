// src/main.ts
import "./style.css";
import { parseMarkdown } from "./MarkdownParser";
import { createPdfDocument } from "./pdfRenderer"; // Geänderter Import
import { debounce } from "./debounce";

let isPreviewLoading = false;

async function initializeApp(): Promise<void> {
  initializeUI();
}

function initializeUI(): void {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
          UN Resolution Generator
        </h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Input Section -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Markdown Eingabe</h2>
            <textarea 
              id="markdown-input" 
              class="w-full h-150 p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Fügen Sie hier Ihr Markdown mit Frontmatter ein..."
            ></textarea>
            
            <div class="flex flex-wrap gap-3 mt-4">
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="live-preview-toggle"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked
                >
                <label for="live-preview-toggle" class="text-sm text-gray-700">
                  Live Vorschau
                </label>
              </div>
              <button 
                id="generate-pdf-btn"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                PDF Herunterladen
              </button>
              <input 
                type="file" 
                id="file-input" 
                accept=".md" 
                class="hidden"
              >
              <button 
                id="load-file-btn"
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Datei Laden
              </button>
              <button 
                id="example-btn"
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Beispiel Laden
              </button>
            </div>
          </div>
          
          <!-- Preview Section -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">PDF Vorschau</h2>
              <div id="preview-status" class="text-sm text-gray-500">
                Bereit
              </div>
            </div>
            <div 
              id="preview-container"
              class="border flex border-gray-200 rounded-md  bg-gray-50"
            >
              <p class="text-gray-500 text-center">
                Geben Sie Markdown ein, um die PDF-Vorschau zu sehen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
}

function attachEventListeners(): void {
  const generatePdfBtn = document.getElementById("generate-pdf-btn")!;
  const loadFileBtn = document.getElementById("load-file-btn")!;
  const exampleBtn = document.getElementById("example-btn")!;
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  const markdownInput = document.getElementById(
    "markdown-input"
  ) as HTMLTextAreaElement;
  const livePreviewToggle = document.getElementById(
    "live-preview-toggle"
  ) as HTMLInputElement;

  generatePdfBtn.addEventListener("click", handleGeneratePDF);
  loadFileBtn.addEventListener("click", () => fileInput.click());
  exampleBtn.addEventListener("click", handleLoadExample);
  fileInput.addEventListener("change", handleLoadFile);
  livePreviewToggle.addEventListener("change", handleLivePreviewToggle);

  const debouncedPreviewUpdate = debounce(handleLivePreviewUpdate, 500);
  markdownInput.addEventListener("input", debouncedPreviewUpdate);

  if (markdownInput.value.trim()) {
    handleLivePreviewUpdate();
  }
}

async function handleLivePreviewUpdate(): Promise<void> {
  const livePreviewToggle = document.getElementById(
    "live-preview-toggle"
  ) as HTMLInputElement;

  if (!livePreviewToggle.checked) {
    return;
  }

  const input = document.getElementById(
    "markdown-input"
  ) as HTMLTextAreaElement;
  const previewContainer = document.getElementById("preview-container")!;
  const previewStatus = document.getElementById("preview-status")!;

  if (!input.value.trim()) {
    previewContainer.innerHTML = `
      <p class="text-gray-500 text-center">
        Geben Sie Markdown ein, um die PDF-Vorschau zu sehen
      </p>
    `;
    previewStatus.textContent = "Bereit";
    return;
  }

  if (isPreviewLoading) {
    return;
  }

  try {
    isPreviewLoading = true;
    previewStatus.textContent = "Generiere Vorschau...";
    previewStatus.className = "text-sm text-blue-500";

    const resolution = parseMarkdown(input.value);
    // 1. Erstelle das PDF-Dokumentobjekt
    const pdfDoc = await createPdfDocument(
      resolution.metadata,
      resolution.content
    );
    // 2. Wandle es für die Vorschau in einen Data-URI um
    const pdfDataUri = pdfDoc.output("datauristring");

    previewContainer.innerHTML = `
      <iframe 
        src="${pdfDataUri}" 
        class="w-300 h-150 border-0 rounded"
        title="PDF Vorschau"
      ></iframe>
    `;

    previewStatus.textContent = "Vorschau aktualisiert";
    previewStatus.className = "text-sm text-green-500";

    setTimeout(() => {
      previewStatus.textContent = "Bereit";
      previewStatus.className = "text-sm text-gray-500";
    }, 2000);
  } catch (error) {
    console.error("Preview error:", error);
    previewContainer.innerHTML = `
      <div class="text-red-600 p-4 bg-red-50 rounded-md w-full">
        <strong>Fehler:</strong> ${error}
      </div>
    `;
    previewStatus.textContent = "Fehler";
    previewStatus.className = "text-sm text-red-500";
  } finally {
    isPreviewLoading = false;
  }
}

function handleLivePreviewToggle(): void {
  const livePreviewToggle = document.getElementById(
    "live-preview-toggle"
  ) as HTMLInputElement;
  const previewContainer = document.getElementById("preview-container")!;

  if (livePreviewToggle.checked) {
    handleLivePreviewUpdate();
  } else {
    previewContainer.innerHTML = `
      <p class="text-gray-500 text-center">
        Live Vorschau deaktiviert
      </p>
    `;
  }
}

async function handleGeneratePDF(): Promise<void> {
  const input = document.getElementById(
    "markdown-input"
  ) as HTMLTextAreaElement;
  const generatePdfBtn = document.getElementById(
    "generate-pdf-btn"
  ) as HTMLButtonElement;

  try {
    generatePdfBtn.disabled = true;
    generatePdfBtn.textContent = "Generiere PDF...";

    const resolution = parseMarkdown(input.value);
    // 1. Erstelle das PDF-Dokumentobjekt
    const pdfDoc = await createPdfDocument(
      resolution.metadata,
      resolution.content
    );
    // 2. Speichere es als Datei
    pdfDoc.save(
      `UN_Resolution_${resolution.metadata.Datum.replace(/-/g, "_")}.pdf`
    );

    generatePdfBtn.textContent = "PDF Heruntergeladen!";
    setTimeout(() => {
      generatePdfBtn.textContent = "PDF Herunterladen";
      generatePdfBtn.disabled = false;
    }, 2000);
  } catch (error) {
    alert(`Fehler beim Generieren der PDF: ${error}`);
    generatePdfBtn.textContent = "PDF Herunterladen";
    generatePdfBtn.disabled = false;
  }
}

function handleLoadFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const textarea = document.getElementById(
        "markdown-input"
      ) as HTMLTextAreaElement;
      textarea.value = content;

      handleLivePreviewUpdate();
    };
    reader.readAsText(file);
  }
}

function handleLoadExample(): void {
  const exampleMarkdown = `---
title: Maßnahmen zur Bewältigung der Sicherheitslage in der Sahelzone und zur Förderung einer nachhaltigen Friedenskonsolidierung in der Region
Datum: 2024-11-20
Lander: Algerien, Ecuador, Guyana, Japan, Malta, Mosambik, Republik Korea, Schweiz, Sierra Leone, Slowenien
Ausschuss: WUT
Typ: Resolutionsentwurf
---
**unter Hinweis** auf seine früheren Resolutionen zur Lage in der Sahelzone, insbesondere die Resolutionen 2391 (2017), 2480 (2019) und 2531 (2020),

*betonend*, dass Frieden und Sicherheit, Entwicklung und Menschenrechte miteinander verknüpft sind und sich gegenseitig verstärken,

**mit Besorgnis feststellend**, dass die Sicherheitslage in der Sahelzone nach wie vor fragil ist und durch verschiedene Faktoren verschärft wird, darunter:

- Terroristische Aktivitäten und organisierte Kriminalität
- Schwache staatliche Institutionen
- Armut und Arbeitslosigkeit
- Klimawandel und Umweltzerstörung
- Grenzüberschreitende Herausforderungen

## Operative Bestimmungen

1. *verurteilt* alle terroristischen Anschläge in der Sahelzone und bekräftigt, dass Terrorismus in all seinen Formen und Ausprägungen eine der schwerwiegendsten Bedrohungen des Weltfriedens und der internationalen Sicherheit darstellt;

2. *fordert* alle Staaten der Region auf, ihre Anstrengungen zur Bekämpfung des Terrorismus und der organisierten Kriminalität zu verstärken und dabei die Menschenrechte und das humanitäre Völkerrecht zu achten;

3. *betont* die Bedeutung einer umfassenden und integrierten Herangehensweise an die Herausforderungen in der Sahelzone, die Sicherheits-, Entwicklungs- und Governance-Aspekte miteinander verknüpft;

4. *ermutigt* die internationale Gemeinschaft, ihre Unterstützung für die Länder der Sahelzone zu verstärken, insbesondere in den Bereichen:
   - Kapazitätsaufbau für Sicherheitskräfte
   - Stärkung der Rechtsstaatlichkeit
   - Förderung nachhaltiger Entwicklung
   - Bekämpfung der Ursachen von Konflikten

5. *ersucht* den Generalsekretär, dem Sicherheitsrat innerhalb von 90 Tagen über die Umsetzung dieser Resolution Bericht zu erstatten;

6. *beschließt*, mit dieser Angelegenheit aktiv befasst zu bleiben.`;

  const textarea = document.getElementById(
    "markdown-input"
  ) as HTMLTextAreaElement;
  textarea.value = exampleMarkdown;

  handleLivePreviewUpdate();
}

// Initialize the application
initializeApp();
