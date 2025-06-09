// src/utils/imageLoader.ts

// Supported image types
export type SupportedImageType =
  | "svg"
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "gif";

// Get MIME type for different image formats
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeTypes[extension.toLowerCase()] || "image/*";
}

// Get file extension from path
function getFileExtension(path: string): string {
  return path.split(".").pop()?.toLowerCase() || "";
}

// Check if the image type is supported
export function isSupportedImageType(path: string): boolean {
  const extension = getFileExtension(path);
  return ["svg", "png", "jpg", "jpeg", "webp", "gif"].includes(extension);
}

// Load any supported image as data URL
export async function loadImageAsDataUrl(path: string): Promise<string> {
  try {
    if (!isSupportedImageType(path)) {
      throw new Error(`Unsupported image type: ${getFileExtension(path)}`);
    }

    const response = await fetch(path);
    const extension = getFileExtension(path);

    if (extension === "svg") {
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: getMimeType(extension) });
      return URL.createObjectURL(blob);
    } else {
      // For raster images, create blob directly from response
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error("Error loading image:", error);
    return "";
  }
}

// Legacy function for backward compatibility
export async function loadSvgAsDataUrl(path: string): Promise<string> {
  return loadImageAsDataUrl(path);
}

// Convert any supported image to base64 with optional resize
export async function convertImageToBase64(
  path: string,
  options: {
    width?: number;
    height?: number;
    outputFormat?: "png" | "jpeg" | "webp";
    quality?: number; // 0-1, only for jpeg and webp
  } = {}
): Promise<string> {
  try {
    if (!isSupportedImageType(path)) {
      throw new Error(`Unsupported image type: ${getFileExtension(path)}`);
    }

    const {
      width = 64,
      height = 64,
      outputFormat = "png",
      quality = 0.9,
    } = options;
    const response = await fetch(path);
    const extension = getFileExtension(path);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        let mimeType = `image/${outputFormat}`;
        let base64: string;

        if (outputFormat === "jpeg" || outputFormat === "webp") {
          base64 = canvas.toDataURL(mimeType, quality);
        } else {
          base64 = canvas.toDataURL(mimeType);
        }

        resolve(base64);
      };

      img.onerror = reject;

      if (extension === "svg") {
        // Handle SVG files
        response
          .text()
          .then((svgText) => {
            const svgBlob = new Blob([svgText], {
              type: getMimeType(extension),
            });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
          })
          .catch(reject);
      } else {
        // Handle raster images
        response
          .blob()
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            img.src = url;
          })
          .catch(reject);
      }
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
}

// Legacy function for backward compatibility
export async function convertSvgToBase64(path: string): Promise<string> {
  return convertImageToBase64(path);
}
