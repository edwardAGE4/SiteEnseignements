/**
 * Regles d'envoi de fichiers, partagees par le navigateur (controle immediat)
 * et le serveur (controle de securite). Chaque type d'envoi definit :
 * le dossier de stockage, les extensions et types MIME autorises, la taille
 * maximale et une verification du contenu reel (signature des premiers octets).
 */

export type UploadKindName = "image" | "pdf" | "file" | "audio";
export type StorageFolder = "images" | "documents" | "audios";

type UploadRule = {
  folder: StorageFolder;
  label: string;
  /** extension (sans point) -> type MIME */
  types: Record<string, string>;
  maxBytes: number;
};

const MB = 1024 * 1024;

const OFFICE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  epub: "application/epub+zip",
  txt: "text/plain",
  csv: "text/csv",
};

export const UPLOAD_RULES: Record<UploadKindName, UploadRule> = {
  image: {
    folder: "images",
    label: "JPEG, PNG ou WebP",
    types: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" },
    maxBytes: 8 * MB,
  },
  pdf: {
    folder: "documents",
    label: "PDF",
    types: { pdf: "application/pdf" },
    maxBytes: 20 * MB,
  },
  file: {
    folder: "documents",
    label: "PDF, Word, Excel, PowerPoint, OpenDocument, EPUB, TXT ou CSV",
    types: OFFICE_TYPES,
    maxBytes: 50 * MB,
  },
  audio: {
    folder: "audios",
    label: "MP3, M4A, AAC, OGG ou WAV",
    types: { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", oga: "audio/ogg", wav: "audio/wav" },
    maxBytes: 200 * MB,
  },
};

export function isUploadKind(value: unknown): value is UploadKindName {
  return typeof value === "string" && value in UPLOAD_RULES;
}

export function fileExtension(fileName: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(fileName.trim());
  return match ? match[1].toLowerCase() : "";
}

/** Type MIME attendu pour ce nom de fichier, ou null si l'extension est refusee. */
export function mimeTypeFor(kind: UploadKindName, fileName: string): string | null {
  return UPLOAD_RULES[kind].types[fileExtension(fileName)] ?? null;
}

function formatMax(bytes: number) {
  return `${Math.round(bytes / MB)} Mo`;
}

/** Controle extension + taille (avant envoi). null si le fichier est acceptable. */
export function validateUpload(kind: UploadKindName, file: { name: string; size: number }): string | null {
  const rule = UPLOAD_RULES[kind];
  if (!mimeTypeFor(kind, file.name)) return `Format non autorisé. Formats acceptés : ${rule.label}.`;
  if (file.size <= 0) return "Le fichier est vide.";
  if (file.size > rule.maxBytes) return `Le fichier ne doit pas dépasser ${formatMax(rule.maxBytes)}.`;
  return null;
}

/* Compatibilite avec les appels existants */
export function validatePdfUpload(file: { name?: string; size: number }): string | null {
  return file.size > UPLOAD_RULES.pdf.maxBytes ? "Le fichier PDF ne doit pas dépasser 20 Mo." : null;
}

export function validateImageUpload(file: { name?: string; size: number }): string | null {
  return file.size > UPLOAD_RULES.image.maxBytes ? "L'image ne doit pas dépasser 8 Mo." : null;
}

/* ------------------------------------------------------------------ */
/* Verification du contenu reel                                        */
/* ------------------------------------------------------------------ */

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

function isZip(buffer: Buffer) {
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

/** Texte brut : aucun octet nul ni caractere de controle binaire dans l'entete. */
function looksLikeText(buffer: Buffer) {
  const allowedControls = new Set([0x09, 0x0a, 0x0c, 0x0d]);
  return !buffer.some((byte) => byte < 0x20 && !allowedControls.has(byte));
}

function isAudio(buffer: Buffer, extension: string) {
  const ascii = buffer.toString("latin1");
  switch (extension) {
    case "mp3":
      // balise ID3 ou trame MPEG (11 bits de synchronisation)
      return ascii.startsWith("ID3") || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    case "aac":
      return buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0;
    case "m4a":
      return ascii.slice(4, 8) === "ftyp";
    case "ogg":
    case "oga":
      return ascii.startsWith("OggS");
    case "wav":
      return ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WAVE";
    default:
      return false;
  }
}

/** Taille d'entete a lire pour verifier un fichier. */
export const HEAD_BYTES = 512;

/**
 * Verifie que le contenu correspond au format annonce par l'extension
 * (un fichier renomme en .pdf ou .mp3 est refuse).
 */
export function matchesSignature(kind: UploadKindName, fileName: string, head: Buffer): boolean {
  const extension = fileExtension(fileName);
  if (!mimeTypeFor(kind, fileName)) return false;

  if (kind === "image") {
    const detected = detectImageType(head);
    return detected !== null && detected === UPLOAD_RULES.image.types[extension];
  }
  if (kind === "audio") return isAudio(head, extension);

  switch (extension) {
    case "pdf":
      return isPdfBuffer(head);
    case "txt":
    case "csv":
      return looksLikeText(head);
    default:
      // docx, xlsx, pptx, odt, ods, odp, epub : archives ZIP
      return isZip(head);
  }
}

export function signatureErrorMessage(kind: UploadKindName): string {
  return `Le contenu du fichier ne correspond pas à son extension. Formats acceptés : ${UPLOAD_RULES[kind].label}.`;
}

/** Libelle court d'un format pour les visiteurs ("PDF", "Word"...). */
export function formatLabel(fileNameOrMime: string | null | undefined): string {
  const value = (fileNameOrMime ?? "").toLowerCase();
  const extension = value.includes("/") ? "" : fileExtension(value);
  const byExtension: Record<string, string> = {
    pdf: "PDF",
    docx: "Word",
    doc: "Word",
    xlsx: "Excel",
    xls: "Excel",
    pptx: "PowerPoint",
    odt: "OpenDocument",
    ods: "OpenDocument",
    odp: "OpenDocument",
    epub: "EPUB",
    txt: "Texte",
    csv: "CSV",
  };
  if (extension && byExtension[extension]) return byExtension[extension];
  const entry = Object.entries(OFFICE_TYPES).find(([, mime]) => mime === value);
  return entry ? (byExtension[entry[0]] ?? entry[0].toUpperCase()) : extension.toUpperCase();
}
