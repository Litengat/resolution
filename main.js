/**
 * Marked.js extension to render YAML-like front matter
 * into an HTML header for a United Nations resolution.
 */
const unResolutionHeaderExtension = {
  // Define a tokenizer for the front matter block
  tokenizer: {
    /**
     * Identifies the front matter block at the beginning of the Markdown content.
     * @param {string} src - The Markdown source string.
     * @returns {object | undefined} - The token object if front matter is found, otherwise undefined.
     */
    frontMatter(src) {
      const match = src.match(/^---\s*([\s\S]*?)\s*^---\s*\n?/m);

      if (match) {
        const content = match[1];
        return {
          type: "frontMatter",
          raw: match[0],
          content: content,
        };
      }
      return undefined;
    },
  },
  // Define a renderer for the 'frontMatter' token
  renderer: {
    /**
     * Renders the front matter content into an HTML header for a UN resolution.
     * @param {string} content - The raw content of the front matter block.
     * @returns {string} - The HTML string for the resolution header.
     */
    frontMatter(content) {
      const parsedData = parseFrontMatter(content);

      // Extract data with default empty strings if not found
      const title = parsedData.title || "";
      const date = parsedData.datum || ""; // Using 'datum' as per your example
      const lander = parsedData.lander || "";
      const ausschuss = parsedData.ausschuss || "";

      // Construct the HTML for the UN resolution header
      return `
          <div class="un-resolution-header">
            <div class="un-resolution-meta">
              <p class="un-resolution-committee">Ausschuss: ${ausschuss}</p>
              <p class="un-resolution-date">Datum: ${date}</p>
            </div>
            <h1 class="un-resolution-title">${title}</h1>
            <p class="un-resolution-country">Länder: ${lander}</p>
          </div>
        `;
    },
  },
};

/**
 * Parses the raw front matter string into a key-value object.
 * @param {string} content - The raw string content of the front matter.
 * @returns {object} - An object where keys are property names and values are their strings.
 */
function parseFrontMatter(content) {
  const data = {};
  const lines = content.split("\n");

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      const parts = trimmedLine.split(/:\s*/);
      if (parts.length >= 2) {
        const key = parts[0].toLowerCase(); // Convert key to lowercase for consistency
        const value = parts.slice(1).join(": ").trim(); // Join parts back in case value contains ':'
        data[key] = value;
      }
    }
  });
  return data;
}

// Example usage with Marked.js:
// First, make sure you have Marked.js installed: npm install marked

// Assuming 'marked' is imported or available in your environment
// const marked = require('marked'); // For Node.js

// Register the extension
marked.use({
  extensions: [unResolutionHeaderExtension],
});

// Your Markdown content with the front matter
const markdownContent = `---
  title: Proposal for Global Climate Action
  Datum: 2025-06-08
  Lander: China
  Ausschuss: SR
  ---
  
  ## Preamble
  
  ... (Rest of your resolution content)
  `;

// Convert the Markdown to HTML
const htmlOutput = marked.parse(markdownContent);

// Log the generated HTML
console.log(htmlOutput);

// You can then insert this HTML into your web page.
// Remember to add CSS for .un-resolution-header, etc., for styling.
