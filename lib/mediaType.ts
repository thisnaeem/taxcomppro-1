export type MediaKind = "photo" | "video" | "document";

const VIDEO_EXT = /\.(mp4|mov|m4v|webm|ogv|avi|mkv)(\?|#|$)/i;
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf)(\?|#|$)/i;

/** Classify a stored media URL (Cloudinary or otherwise) by its path / extension. */
export function mediaKind(url: string): MediaKind {
  if (/\/video\/upload\//.test(url) || VIDEO_EXT.test(url)) return "video";
  if (/\/raw\/upload\//.test(url) || DOC_EXT.test(url)) return "document";
  return "photo";
}

/** Readable file name for document tiles. */
export function mediaFileName(url: string) {
  const last = decodeURIComponent(url.split(/[?#]/)[0].split("/").pop() || "Document");
  return last.replace(/_[a-z0-9]{6}(?=\.[a-z0-9]+$)/i, ""); // drop Cloudinary's unique suffix
}
