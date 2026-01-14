import jsPDF from 'jspdf';
import { ResearchPrediction } from '@/types/prediction';
import { Stock } from '@/types/stock';
import { sanitizeForPDF } from './pdf/fontLoader';

export async function generateResearchPDF(prediction: ResearchPrediction, stock: Stock) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Helper function to sanitize text
  const clean = (text: string | undefined | null): string => sanitizeForPDF(text);

  // Helper function to check page break
  const checkPageBreak = (neededSpace: number = 30) => {
    if (y > 270 - neededSpace) {
      doc.addPage();
      y = 20;
    }
  };

  // Cover/Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(clean(prediction.symbol), pageWidth / 2, y, { align: 'center' });
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Equity Research Report', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.text(clean(prediction.companyName), pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text(`Generated: ${new Date(prediction.timestamp).toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Divider line
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Snapshot Panel
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESEARCH SNAPSHOT', 20, y);
  y += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Current Price: Rs.${stock.lastPrice.toLocaleString()}`, 20, y);
  doc.text(`52-Week Range: Rs.${stock.yearLow.toLocaleString()} - Rs.${stock.yearHigh.toLocaleString()}`, 100, y);
  y += 6;
  doc.text(`Trend: ${clean(prediction.verdict.trend)}`, 20, y);
  doc.text(`Confidence: ${prediction.verdict.confidencePercent}%`, 70, y);
  doc.text(`Analyst Bias: ${clean(prediction.verdict.analystBias)}`, 120, y);
  y += 10;

  // Verdict Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VERDICT', 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const verdictLines = doc.splitTextToSize(clean(prediction.verdict.reasoningSentence), pageWidth - 40);
  doc.text(verdictLines, 20, y);
  y += verdictLines.length * 4 + 6;

  // Key Price Levels
  doc.setFont('helvetica', 'bold');
  doc.text('KEY LEVELS', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Support: Rs.${prediction.priceLevels.support?.toLocaleString() || 'N/A'}`, 20, y);
  doc.text(`Resistance: Rs.${prediction.priceLevels.resistance?.toLocaleString() || 'N/A'}`, 80, y);
  doc.text(`Trend Strength: ${clean(prediction.priceLevels.trendStrength)}`, 140, y);
  y += 10;

  // Technical Indicators Section
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TECHNICAL INDICATORS (Probabilistic Estimates)', 20, y);
  y += 7;
  
  const indicators = prediction.technicalIndicators;
  if (indicators) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`RSI Status: ${clean(indicators.rsiStatus)}`, 20, y);
    doc.text(`MACD Signal: ${clean(indicators.macdSignal)}`, 80, y);
    doc.text(`Overall Bias: ${clean(indicators.overallBias)}`, 140, y);
    y += 6;
    
    const rsiLines = doc.splitTextToSize(`RSI: ${clean(indicators.rsiReasoning)}`, pageWidth - 40);
    doc.text(rsiLines, 20, y);
    y += rsiLines.length * 4 + 2;
    
    const macdLines = doc.splitTextToSize(`MACD: ${clean(indicators.macdReasoning)}`, pageWidth - 40);
    doc.text(macdLines, 20, y);
    y += macdLines.length * 4 + 2;
    
    const shortMALines = doc.splitTextToSize(`20-Day MA: ${clean(indicators.shortMA)}`, pageWidth - 40);
    doc.text(shortMALines, 20, y);
    y += shortMALines.length * 4 + 2;
    
    const medMALines = doc.splitTextToSize(`50-Day MA: ${clean(indicators.mediumMA)}`, pageWidth - 40);
    doc.text(medMALines, 20, y);
    y += medMALines.length * 4 + 2;
    
    const longMALines = doc.splitTextToSize(`200-Day MA: ${clean(indicators.longMA)}`, pageWidth - 40);
    doc.text(longMALines, 20, y);
    y += longMALines.length * 4 + 8;
  }

  // Executive Summary
  checkPageBreak(50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(clean(prediction.executiveSummary), pageWidth - 40);
  
  for (let i = 0; i < summaryLines.length; i++) {
    checkPageBreak(6);
    doc.text(summaryLines[i], 20, y);
    y += 4;
  }
  y += 6;

  // Technical Structure
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TECHNICAL STRUCTURE', 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (prediction.technicalStructure) {
    Object.entries(prediction.technicalStructure).forEach(([key, value]) => {
      checkPageBreak(8);
      const lines = doc.splitTextToSize(`- ${clean(String(value))}`, pageWidth - 45);
      doc.text(lines, 25, y);
      y += lines.length * 4 + 2;
    });
  }
  y += 4;

  // Scenario Analysis
  checkPageBreak(50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SCENARIO ANALYSIS', 20, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (prediction.scenarios) {
    Object.values(prediction.scenarios).forEach((s: any) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`${clean(s.name)} (${clean(s.probability)})`, 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const behaviorLines = doc.splitTextToSize(clean(s.expectedBehavior), pageWidth - 45);
      doc.text(behaviorLines, 25, y);
      y += behaviorLines.length * 4 + 2;
      
      if (s.keyTriggers && s.keyTriggers.length > 0) {
        const triggersText = s.keyTriggers.map((t: string) => clean(t)).join(', ');
        doc.text(`Key Triggers: ${triggersText}`, 25, y);
        y += 6;
      }
    });
  }
  y += 4;

  // Risk Dashboard
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK DASHBOARD', 20, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (prediction.riskDashboard) {
    prediction.riskDashboard.forEach((risk) => {
      checkPageBreak(8);
      doc.text(`- ${clean(risk.type)} (${clean(risk.level)}): ${clean(risk.description)}`, 25, y);
      y += 5;
    });
  }
  y += 6;

  // Timeframe Outlooks
  if (prediction.timeframeOutlooks) {
    checkPageBreak(30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MULTI-TIMEFRAME OUTLOOK', 20, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const { shortTerm, mediumTerm, longTerm } = prediction.timeframeOutlooks;
    doc.text(`Short-term (${clean(shortTerm.days)}): ${shortTerm.bias.toUpperCase()} - ${clean(shortTerm.outlook)}`, 20, y);
    y += 5;
    doc.text(`Medium-term (${clean(mediumTerm.weeks)}): ${mediumTerm.bias.toUpperCase()} - ${clean(mediumTerm.outlook)}`, 20, y);
    y += 5;
    doc.text(`Long-term (${clean(longTerm.months)}): ${longTerm.bias.toUpperCase()} - ${clean(longTerm.outlook)}`, 20, y);
    y += 8;
  }

  // Conclusion
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCLUSION', 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const conclusionLines = doc.splitTextToSize(clean(prediction.conclusion), pageWidth - 40);
  for (let i = 0; i < conclusionLines.length; i++) {
    checkPageBreak(6);
    doc.text(conclusionLines[i], 20, y);
    y += 4;
  }
  y += 8;

  // Disclaimer
  checkPageBreak(40);
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DISCLAIMER', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const disclaimerLines = doc.splitTextToSize(clean(prediction.legalDisclaimer), pageWidth - 40);
  for (let i = 0; i < disclaimerLines.length; i++) {
    checkPageBreak(5);
    doc.text(disclaimerLines[i], 20, y);
    y += 3.5;
  }

  // Save
  doc.save(`${prediction.symbol}_Research_Report.pdf`);
}
