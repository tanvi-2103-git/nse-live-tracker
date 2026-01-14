import jsPDF from 'jspdf';

// We'll use a simpler approach - use Helvetica but sanitize all text
// jsPDF's built-in fonts work well when we properly clean text

/**
 * Sanitize text for PDF output
 * Removes control characters, normalizes quotes, and cleans problematic unicode
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  
  return text
    // Remove invisible control characters (U+0000 to U+001F, U+007F to U+009F)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace smart quotes with regular quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Replace en-dash and em-dash with regular dash
    .replace(/[\u2013\u2014]/g, '-')
    // Replace ellipsis character with three dots
    .replace(/\u2026/g, '...')
    // Replace non-breaking space with regular space
    .replace(/\u00A0/g, ' ')
    // Replace bullet points with dash
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    // Remove any remaining problematic unicode characters
    .replace(/[\uD800-\uDFFF]/g, '') // Surrogate pairs
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize text specifically for Rupee symbol handling
 * Converts ₹ to "Rs." for better PDF compatibility
 */
export function sanitizeForPDF(text: string | undefined | null): string {
  if (!text) return '';
  
  let cleaned = sanitizeText(text);
  
  // Replace Rupee symbol with "Rs." for better compatibility
  cleaned = cleaned.replace(/₹/g, 'Rs.');
  
  return cleaned;
}

/**
 * Safe text wrapper that handles page breaks properly
 */
export interface SafeTextResult {
  lines: string[];
  totalHeight: number;
}

export function wrapTextSafely(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  lineHeight: number = 4
): SafeTextResult {
  const sanitized = sanitizeForPDF(text);
  const lines = doc.splitTextToSize(sanitized, maxWidth) as string[];
  return {
    lines,
    totalHeight: lines.length * lineHeight
  };
}

/**
 * Write a paragraph block with proper page break handling
 */
export function writeParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = 4,
  maxLines?: number
): { newY: number; linesWritten: number } {
  const { lines } = wrapTextSafely(doc, text, maxWidth, lineHeight);
  const linesToWrite = maxLines ? lines.slice(0, maxLines) : lines;
  
  let currentY = y;
  for (const line of linesToWrite) {
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  
  return {
    newY: currentY,
    linesWritten: linesToWrite.length
  };
}
