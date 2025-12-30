import jsPDF from 'jspdf';
import { ResearchPrediction } from '@/types/prediction';
import { Stock } from '@/types/stock';

export async function generateResearchPDF(prediction: ResearchPrediction, stock: Stock) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${prediction.symbol} - Equity Research Report`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${prediction.companyName} | Generated: ${new Date(prediction.timestamp).toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Verdict
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VERDICT', 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Trend: ${prediction.verdict.trend} | Confidence: ${prediction.verdict.confidencePercent}% | Bias: ${prediction.verdict.analystBias}`, 20, y);
  y += 12;

  // Price Levels
  doc.setFont('helvetica', 'bold');
  doc.text('KEY LEVELS', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Support: ₹${prediction.priceLevels.support} | Resistance: ₹${prediction.priceLevels.resistance} | Trend Strength: ${prediction.priceLevels.trendStrength}`, 20, y);
  y += 12;

  // Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(prediction.executiveSummary, pageWidth - 40);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 5 + 10;

  // Scenarios
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.text('SCENARIO ANALYSIS', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  
  if (prediction.scenarios) {
    Object.values(prediction.scenarios).forEach((s: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${s.name} (${s.probability}): ${s.expectedBehavior}`, 20, y);
      y += 6;
    });
  }
  y += 8;

  // Conclusion
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.text('CONCLUSION', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  const conclusionLines = doc.splitTextToSize(prediction.conclusion, pageWidth - 40);
  doc.text(conclusionLines, 20, y);
  y += conclusionLines.length * 5 + 10;

  // Disclaimer
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(8);
  doc.text('DISCLAIMER', 20, y);
  y += 5;
  const disclaimerLines = doc.splitTextToSize(prediction.legalDisclaimer, pageWidth - 40);
  doc.text(disclaimerLines, 20, y);

  doc.save(`${prediction.symbol}_Research_Report.pdf`);
}
