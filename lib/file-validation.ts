const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 Mo
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 Mo

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

export function detectImageType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  const bytes = buffer.subarray(0, 12);
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export function validatePdfUpload(file: File | { size: number }): string | null {
  if (file.size > MAX_PDF_SIZE) return "Le fichier PDF ne doit pas depasser 20 Mo.";
  return null;
}

export function validateImageUpload(file: File | { size: number }): string | null {
  if (file.size > MAX_IMAGE_SIZE) return "L'image ne doit pas depasser 8 Mo.";
  return null;
}
