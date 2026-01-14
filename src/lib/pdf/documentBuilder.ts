import jsPDF from 'jspdf';
import { COLORS, type PDFColors } from './colors';
import { sanitizeForPDF, wrapTextSafely } from './fontLoader';

export interface PDFDocumentConfig {
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
}

/**
 * Creates a configured jsPDF document with helper methods
 */
export function createPDFDocument() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  const config: PDFDocumentConfig = {
    margin,
    pageWidth,
    pageHeight,
    contentWidth
  };
  
  let pageNumber = 1;
  let y = margin;
  
  // Color helpers
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };
  
  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };
  
  const setDrawColor = (color: [number, number, number]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
  };
  
  // Page management
  const addPageFooter = () => {
    const footerY = pageHeight - 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.textMuted);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text('CONFIDENTIAL - For Educational Purposes Only', margin, footerY);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, footerY, { align: 'right' });
  };
  
  const addNewPage = () => {
    doc.addPage();
    pageNumber++;
    y = margin;
    addPageFooter();
  };
  
  const checkPageBreak = (neededSpace: number = 30): boolean => {
    if (y > pageHeight - margin - neededSpace) {
      addNewPage();
      return true;
    }
    return false;
  };
  
  const getY = () => y;
  const setY = (newY: number) => { y = newY; };
  const addY = (delta: number) => { y += delta; };
  
  // Text writing helpers
  const writeText = (text: string, x: number, yPos?: number) => {
    const sanitized = sanitizeForPDF(text);
    doc.text(sanitized, x, yPos ?? y);
  };
  
  const writeParagraph = (
    text: string,
    x: number,
    maxWidth: number,
    lineHeight: number = 4,
    maxLines?: number
  ): number => {
    const { lines } = wrapTextSafely(doc, text, maxWidth, lineHeight);
    const linesToWrite = maxLines ? lines.slice(0, maxLines) : lines;
    
    for (const line of linesToWrite) {
      doc.text(line, x, y);
      y += lineHeight;
    }
    
    return linesToWrite.length;
  };
  
  const wrapText = (text: string, maxWidth: number): string[] => {
    return wrapTextSafely(doc, text, maxWidth).lines;
  };
  
  // Section header without emoji icons
  const drawSectionHeader = (title: string) => {
    checkPageBreak(20);
    
    // Background bar
    setFillColor(COLORS.primary);
    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
    
    // Title - clean text only
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.cardBg);
    writeText(title.toUpperCase(), margin + 4, y + 5.5);
    y += 12;
  };
  
  // Card drawing
  const drawCard = (
    x: number,
    width: number,
    height: number,
    title: string,
    value: string,
    subtitle?: string,
    color?: [number, number, number]
  ) => {
    setFillColor(COLORS.cardBg);
    setDrawColor(COLORS.border);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.textMuted);
    writeText(title, x + 3, y + 5);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(color || COLORS.text);
    writeText(value, x + 3, y + 12);
    
    if (subtitle) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.textMuted);
      writeText(subtitle, x + 3, y + 16);
    }
  };
  
  // Progress bar
  const drawProgressBar = (x: number, width: number, value: number, color: [number, number, number]) => {
    setFillColor(COLORS.border);
    doc.roundedRect(x, y, width, 3, 1, 1, 'F');
    
    const progressWidth = (width * Math.min(value, 100)) / 100;
    setFillColor(color);
    doc.roundedRect(x, y, progressWidth, 3, 1, 1, 'F');
  };
  
  return {
    doc,
    config,
    // Color helpers
    setColor,
    setFillColor,
    setDrawColor,
    // Page helpers
    addNewPage,
    checkPageBreak,
    addPageFooter,
    // Position helpers
    getY,
    setY,
    addY,
    // Text helpers
    writeText,
    writeParagraph,
    wrapText,
    // Drawing helpers
    drawSectionHeader,
    drawCard,
    drawProgressBar,
    // Save
    save: (filename: string) => doc.save(filename)
  };
}

export type PDFDocument = ReturnType<typeof createPDFDocument>;
