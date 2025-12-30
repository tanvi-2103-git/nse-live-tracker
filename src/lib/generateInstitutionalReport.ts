import jsPDF from 'jspdf';
import { ResearchPrediction } from '@/types/prediction';
import { Stock } from '@/types/stock';

// Premium Institutional Research Report Generator - Level 3
// Designed to match Goldman Sachs / Motilal Oswal quality

interface PDFColors {
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  success: [number, number, number];
  danger: [number, number, number];
  warning: [number, number, number];
  text: [number, number, number];
  textMuted: [number, number, number];
  background: [number, number, number];
  cardBg: [number, number, number];
  border: [number, number, number];
}

const COLORS: PDFColors = {
  primary: [20, 184, 166],    // Teal
  secondary: [30, 41, 59],     // Slate
  accent: [245, 158, 11],      // Amber
  success: [34, 197, 94],      // Green
  danger: [239, 68, 68],       // Red
  warning: [251, 191, 36],     // Yellow
  text: [15, 23, 42],          // Dark text
  textMuted: [100, 116, 139],  // Muted text
  background: [248, 250, 252], // Light gray
  cardBg: [255, 255, 255],     // White
  border: [226, 232, 240],     // Light border
};

export async function generateInstitutionalReport(prediction: ResearchPrediction, stock: Stock) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  let pageNumber = 1;

  // Helper functions
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const setDrawColor = (color: [number, number, number]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
  };

  const addNewPage = () => {
    doc.addPage();
    pageNumber++;
    y = margin;
    addPageFooter();
  };

  const checkPageBreak = (neededSpace: number = 30) => {
    if (y > pageHeight - margin - neededSpace) {
      addNewPage();
    }
  };

  const addPageFooter = () => {
    const footerY = pageHeight - 8;
    doc.setFontSize(7);
    setColor(COLORS.textMuted);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text('CONFIDENTIAL - For Educational Purposes Only', margin, footerY);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, footerY, { align: 'right' });
  };

  const drawSectionHeader = (title: string, icon?: string) => {
    checkPageBreak(20);
    // Background bar
    setFillColor(COLORS.primary);
    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
    
    // Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.cardBg);
    doc.text(`${icon ? icon + ' ' : ''}${title}`, margin + 4, y + 5.5);
    y += 12;
  };

  const drawCard = (x: number, width: number, height: number, title: string, value: string, subtitle?: string, color?: [number, number, number]) => {
    // Card background
    setFillColor(COLORS.cardBg);
    setDrawColor(COLORS.border);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');
    
    // Title
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.textMuted);
    doc.text(title, x + 3, y + 5);
    
    // Value
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(color || COLORS.text);
    doc.text(value, x + 3, y + 12);
    
    // Subtitle
    if (subtitle) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.textMuted);
      doc.text(subtitle, x + 3, y + 16);
    }
  };

  const drawProgressBar = (x: number, width: number, value: number, color: [number, number, number]) => {
    // Background
    setFillColor(COLORS.border);
    doc.roundedRect(x, y, width, 3, 1, 1, 'F');
    
    // Progress
    const progressWidth = (width * Math.min(value, 100)) / 100;
    setFillColor(color);
    doc.roundedRect(x, y, progressWidth, 3, 1, 1, 'F');
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    return doc.splitTextToSize(text || '', maxWidth);
  };

  // ==================== PAGE 1: COVER PAGE ====================
  
  // Header gradient simulation
  setFillColor(COLORS.secondary);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Accent line
  setFillColor(COLORS.primary);
  doc.rect(0, 58, pageWidth, 3, 'F');
  
  // Logo/Brand area
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.cardBg);
  doc.text('INSTITUTIONAL EQUITY RESEARCH', margin, 15);
  
  // Symbol and Company
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text(prediction.symbol, margin, 35);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(prediction.companyName, margin, 45);
  
  // Exchange badge
  doc.setFontSize(8);
  setFillColor(COLORS.primary);
  doc.roundedRect(margin, 48, 25, 5, 1, 1, 'F');
  setColor(COLORS.cardBg);
  doc.text('NSE LISTED', margin + 3, 52);
  
  // Report type
  doc.setFontSize(10);
  setColor(COLORS.textMuted);
  doc.text('Comprehensive Technical & Fundamental Analysis', margin, 75);
  
  // Date
  doc.setFontSize(9);
  doc.text(`Report Date: ${new Date(prediction.timestamp).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, 82);
  
  // Verdict Badge
  y = 95;
  const verdictColor = prediction.verdict.trend === 'Bullish' ? COLORS.success : 
                       prediction.verdict.trend === 'Bearish' ? COLORS.danger : COLORS.warning;
  setFillColor(verdictColor);
  doc.roundedRect(margin, y, 50, 20, 3, 3, 'F');
  
  doc.setFontSize(8);
  setColor(COLORS.cardBg);
  doc.text('OVERALL VERDICT', margin + 5, y + 6);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(prediction.verdict.trend.toUpperCase(), margin + 5, y + 15);
  
  // Confidence & Bias cards
  const cardWidth = 45;
  drawCard(margin + 55, cardWidth, 20, 'CONFIDENCE', `${prediction.verdict.confidencePercent}%`, 'AI Analysis Score');
  drawCard(margin + 105, cardWidth, 20, 'ANALYST BIAS', prediction.verdict.analystBias, prediction.verdict.outlookHorizon);
  
  y = 125;
  
  // Key Metrics Panel
  setFillColor(COLORS.background);
  doc.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
  
  const metricsY = y + 5;
  const colWidth = contentWidth / 5;
  
  // Current Price
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  doc.text('CURRENT PRICE', margin + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  doc.text(`₹${stock.lastPrice.toLocaleString()}`, margin + 5, metricsY + 8);
  
  // Change
  const changeColor = stock.pChange >= 0 ? COLORS.success : COLORS.danger;
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  doc.text('CHANGE', margin + colWidth + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(changeColor);
  doc.text(`${stock.pChange >= 0 ? '+' : ''}${stock.pChange.toFixed(2)}%`, margin + colWidth + 5, metricsY + 8);
  
  // 52W High
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  doc.text('52W HIGH', margin + colWidth * 2 + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  doc.text(`₹${stock.yearHigh.toLocaleString()}`, margin + colWidth * 2 + 5, metricsY + 8);
  
  // 52W Low
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  doc.text('52W LOW', margin + colWidth * 3 + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  doc.text(`₹${stock.yearLow.toLocaleString()}`, margin + colWidth * 3 + 5, metricsY + 8);
  
  // Day Range
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  doc.text('DAY RANGE', margin + colWidth * 4 + 5, metricsY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  doc.text(`₹${stock.dayLow} - ₹${stock.dayHigh}`, margin + colWidth * 4 + 5, metricsY + 8);
  
  // Support/Resistance line
  y = metricsY + 18;
  doc.setFontSize(8);
  setColor(COLORS.textMuted);
  doc.text(`Support: ₹${prediction.priceLevels.support?.toLocaleString() || 'N/A'}`, margin + 5, y);
  doc.text(`Resistance: ₹${prediction.priceLevels.resistance?.toLocaleString() || 'N/A'}`, margin + 60, y);
  doc.text(`Trend Strength: ${prediction.priceLevels.trendStrength}`, margin + 120, y);
  
  y = 170;
  
  // Executive Summary Box
  drawSectionHeader('EXECUTIVE SUMMARY', '📊');
  
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.border);
  doc.roundedRect(margin, y, contentWidth, 40, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const summaryLines = wrapText(prediction.executiveSummary, contentWidth - 10);
  let textY = y + 6;
  for (let i = 0; i < Math.min(summaryLines.length, 8); i++) {
    doc.text(summaryLines[i], margin + 5, textY);
    textY += 4.5;
  }
  
  y += 48;
  
  // Technical Indicators Quick View
  drawSectionHeader('TECHNICAL INDICATORS SNAPSHOT', '📈');
  
  const indicators = prediction.technicalIndicators;
  if (indicators) {
    const indicatorCards = [
      { label: 'RSI STATUS', value: indicators.rsiStatus, color: indicators.rsiStatus === 'Overbought' ? COLORS.warning : indicators.rsiStatus === 'Oversold' ? COLORS.primary : COLORS.textMuted },
      { label: 'MACD SIGNAL', value: indicators.macdSignal, color: indicators.macdSignal === 'Bullish' ? COLORS.success : indicators.macdSignal === 'Bearish' ? COLORS.danger : COLORS.warning },
      { label: 'MA TREND', value: indicators.overallBias, color: indicators.overallBias === 'Bullish' ? COLORS.success : indicators.overallBias === 'Bearish' ? COLORS.danger : COLORS.warning },
    ];
    
    const cardW = (contentWidth - 10) / 3;
    indicatorCards.forEach((card, i) => {
      const x = margin + (cardW + 5) * i;
      setFillColor(COLORS.cardBg);
      setDrawColor(card.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, 18, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      doc.setFontSize(7);
      setColor(COLORS.textMuted);
      doc.text(card.label, x + 4, y + 6);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(card.color);
      doc.text(card.value, x + 4, y + 14);
    });
  }
  
  y += 25;
  
  addPageFooter();
  
  // ==================== PAGE 2: TECHNICAL ANALYSIS ====================
  addNewPage();
  
  drawSectionHeader('DETAILED TECHNICAL ANALYSIS', '🔬');
  
  // RSI Analysis
  if (indicators) {
    setFillColor(COLORS.cardBg);
    setDrawColor(COLORS.border);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    doc.text('RSI (Relative Strength Index)', margin + 4, y + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    const rsiLines = wrapText(indicators.rsiReasoning, contentWidth - 8);
    for (let i = 0; i < Math.min(rsiLines.length, 3); i++) {
      doc.text(rsiLines[i], margin + 4, y + 12 + (i * 4));
    }
    y += 26;
    
    // MACD Analysis
    setFillColor(COLORS.cardBg);
    setDrawColor(COLORS.border);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    doc.text('MACD (Moving Average Convergence Divergence)', margin + 4, y + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    const macdLines = wrapText(indicators.macdReasoning, contentWidth - 8);
    for (let i = 0; i < Math.min(macdLines.length, 3); i++) {
      doc.text(macdLines[i], margin + 4, y + 12 + (i * 4));
    }
    y += 26;
    
    // Moving Averages
    drawSectionHeader('MOVING AVERAGE ANALYSIS', '📉');
    
    const maData = [
      { period: '20-Day MA', analysis: indicators.shortMA, type: 'Short-term Trend' },
      { period: '50-Day MA', analysis: indicators.mediumMA, type: 'Medium-term Trend' },
      { period: '200-Day MA', analysis: indicators.longMA, type: 'Long-term Trend' },
    ];
    
    maData.forEach((ma) => {
      checkPageBreak(18);
      setFillColor(COLORS.background);
      doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.text);
      doc.text(ma.period, margin + 4, y + 5);
      
      doc.setFontSize(7);
      setColor(COLORS.textMuted);
      doc.text(ma.type, margin + 45, y + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.text);
      const maLines = wrapText(ma.analysis, contentWidth - 8);
      doc.text(maLines[0] || '', margin + 4, y + 11);
      
      y += 18;
    });
  }
  
  y += 5;
  
  // Price Structure
  drawSectionHeader('PRICE & TECHNICAL STRUCTURE', '🏗️');
  
  if (prediction.technicalStructure) {
    const structureItems = Object.entries(prediction.technicalStructure);
    structureItems.forEach(([key, value]) => {
      checkPageBreak(12);
      
      setFillColor(COLORS.cardBg);
      setDrawColor(COLORS.border);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.text);
      const lines = wrapText(String(value), contentWidth - 8);
      doc.text(lines[0] || '', margin + 4, y + 6);
      
      y += 12;
    });
  }
  
  // ==================== PAGE 3: SCENARIO ANALYSIS ====================
  addNewPage();
  
  drawSectionHeader('SCENARIO-BASED PROBABILITY FORECAST', '🎯');
  
  // Probability Matrix Table Header
  setFillColor(COLORS.secondary);
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text('SCENARIO', margin + 4, y + 5.5);
  doc.text('PROBABILITY', margin + 50, y + 5.5);
  doc.text('EXPECTED BEHAVIOR', margin + 85, y + 5.5);
  y += 10;
  
  if (prediction.scenarios) {
    const scenarioOrder = ['baseCase', 'bullCase', 'bearCase'] as const;
    const scenarioColors: Record<string, [number, number, number]> = {
      baseCase: COLORS.primary,
      bullCase: COLORS.success,
      bearCase: COLORS.danger,
    };
    
    scenarioOrder.forEach((key) => {
      const scenario = prediction.scenarios[key];
      if (!scenario) return;
      
      checkPageBreak(25);
      
      const color = scenarioColors[key];
      
      // Scenario card
      setFillColor(COLORS.cardBg);
      setDrawColor(color);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      // Left accent bar
      setFillColor(color);
      doc.roundedRect(margin, y, 3, 20, 1, 1, 'F');
      
      // Scenario name
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      setColor(color);
      doc.text(scenario.name, margin + 6, y + 6);
      
      // Probability badge
      setFillColor(color);
      doc.roundedRect(margin + 50, y + 2, 25, 6, 1, 1, 'F');
      doc.setFontSize(7);
      setColor(COLORS.cardBg);
      doc.text(scenario.probability, margin + 54, y + 6);
      
      // Expected behavior
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.text);
      const behaviorLines = wrapText(scenario.expectedBehavior, contentWidth - 90);
      doc.text(behaviorLines[0] || '', margin + 6, y + 13);
      if (behaviorLines[1]) {
        doc.text(behaviorLines[1], margin + 6, y + 17);
      }
      
      y += 24;
      
      // Key triggers
      if (scenario.keyTriggers && scenario.keyTriggers.length > 0) {
        doc.setFontSize(7);
        setColor(COLORS.textMuted);
        doc.text(`Key Triggers: ${scenario.keyTriggers.slice(0, 3).join(' | ')}`, margin + 6, y);
        y += 6;
      }
    });
  }
  
  y += 10;
  
  // ==================== RISK DASHBOARD ====================
  drawSectionHeader('RISK ASSESSMENT DASHBOARD', '⚠️');
  
  if (prediction.riskDashboard && prediction.riskDashboard.length > 0) {
    const riskColors: Record<string, [number, number, number]> = {
      low: COLORS.success,
      medium: COLORS.warning,
      high: COLORS.danger,
    };
    
    const colW = (contentWidth - 5) / 2;
    prediction.riskDashboard.forEach((risk, i) => {
      const col = i % 2;
      const x = margin + (colW + 5) * col;
      
      if (col === 0) checkPageBreak(18);
      
      const color = riskColors[risk.level] || COLORS.textMuted;
      
      setFillColor(COLORS.cardBg);
      setDrawColor(color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, colW, 15, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      // Risk type
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.text);
      doc.text(risk.type, x + 4, y + 5);
      
      // Level badge
      setFillColor(color);
      doc.roundedRect(x + colW - 20, y + 2, 16, 5, 1, 1, 'F');
      doc.setFontSize(6);
      setColor(COLORS.cardBg);
      doc.text(risk.level.toUpperCase(), x + colW - 18, y + 5.5);
      
      // Description
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.textMuted);
      const descLines = wrapText(risk.description, colW - 8);
      doc.text(descLines[0] || '', x + 4, y + 11);
      
      if (col === 1) y += 18;
    });
    
    if (prediction.riskDashboard.length % 2 !== 0) y += 18;
  }
  
  y += 10;
  
  // ==================== PAGE 4: MULTI-TIMEFRAME & CONCLUSION ====================
  addNewPage();
  
  drawSectionHeader('MULTI-TIMEFRAME OUTLOOK', '⏳');
  
  if (prediction.timeframeOutlooks) {
    const timeframes = [
      { label: 'SHORT-TERM', period: prediction.timeframeOutlooks.shortTerm.days, bias: prediction.timeframeOutlooks.shortTerm.bias, outlook: prediction.timeframeOutlooks.shortTerm.outlook },
      { label: 'MEDIUM-TERM', period: prediction.timeframeOutlooks.mediumTerm.weeks, bias: prediction.timeframeOutlooks.mediumTerm.bias, outlook: prediction.timeframeOutlooks.mediumTerm.outlook },
      { label: 'LONG-TERM', period: prediction.timeframeOutlooks.longTerm.months, bias: prediction.timeframeOutlooks.longTerm.bias, outlook: prediction.timeframeOutlooks.longTerm.outlook },
    ];
    
    const tfWidth = (contentWidth - 10) / 3;
    timeframes.forEach((tf, i) => {
      const x = margin + (tfWidth + 5) * i;
      const biasColor = tf.bias === 'bullish' ? COLORS.success : tf.bias === 'bearish' ? COLORS.danger : COLORS.warning;
      
      setFillColor(COLORS.cardBg);
      setDrawColor(biasColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, tfWidth, 28, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      // Top accent
      setFillColor(biasColor);
      doc.roundedRect(x, y, tfWidth, 3, 2, 2, 'F');
      doc.rect(x, y + 2, tfWidth, 1, 'F');
      
      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.textMuted);
      doc.text(tf.label, x + 4, y + 9);
      
      // Period
      doc.setFontSize(8);
      setColor(COLORS.text);
      doc.text(tf.period, x + 4, y + 14);
      
      // Bias
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      setColor(biasColor);
      doc.text(tf.bias.toUpperCase(), x + 4, y + 21);
      
      // Outlook text below card
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.textMuted);
      const outlookLines = wrapText(tf.outlook, tfWidth - 4);
      doc.text(outlookLines[0] || '', x + 2, y + 32);
    });
    
    y += 45;
  }
  
  // Company Context
  drawSectionHeader('COMPANY & SECTOR CONTEXT', '🏢');
  
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.border);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const contextLines = wrapText(prediction.companyContext || 'Company context information not available for this analysis.', contentWidth - 8);
  let contextY = y + 6;
  for (let i = 0; i < Math.min(contextLines.length, 5); i++) {
    doc.text(contextLines[i], margin + 4, contextY);
    contextY += 4;
  }
  
  y += 30;
  
  // Sector Positioning
  if (prediction.sectorPositioning) {
    setFillColor(COLORS.background);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    doc.text('Sector Positioning:', margin + 4, y + 6);
    
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    const sectorLines = wrapText(prediction.sectorPositioning, contentWidth - 8);
    doc.text(sectorLines[0] || '', margin + 4, y + 12);
    
    y += 22;
  }
  
  // Final Conclusion
  drawSectionHeader('FINAL CONCLUSION & RECOMMENDATION', '✅');
  
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.primary);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'FD');
  doc.setLineWidth(0.2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const conclusionLines = wrapText(prediction.conclusion, contentWidth - 10);
  let conclusionY = y + 7;
  for (let i = 0; i < Math.min(conclusionLines.length, 7); i++) {
    doc.text(conclusionLines[i], margin + 5, conclusionY);
    conclusionY += 4.5;
  }
  
  y += 42;
  
  // Confidence meter
  checkPageBreak(15);
  setFillColor(COLORS.background);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  doc.text('AI Confidence Score:', margin + 4, y + 7);
  
  const confX = margin + 50;
  const confWidth = 80;
  drawProgressBar(confX, confWidth, prediction.verdict.confidencePercent, COLORS.primary);
  
  doc.setFontSize(10);
  setColor(COLORS.primary);
  doc.text(`${prediction.verdict.confidencePercent}%`, confX + confWidth + 5, y + 8);
  
  y += 18;
  
  // ==================== DISCLAIMER PAGE ====================
  addNewPage();
  
  // Disclaimer header
  setFillColor(COLORS.secondary);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text('⚖️ IMPORTANT DISCLAIMERS & DISCLOSURES', margin + 5, y + 8);
  y += 18;
  
  // Risk transparency
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.warning);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'FD');
  doc.setLineWidth(0.2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.warning);
  doc.text('Risk Transparency Statement', margin + 4, y + 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const riskLines = wrapText(prediction.riskTransparency, contentWidth - 8);
  for (let i = 0; i < Math.min(riskLines.length, 3); i++) {
    doc.text(riskLines[i], margin + 4, y + 14 + (i * 4));
  }
  y += 30;
  
  // Professional disclaimer
  setFillColor(COLORS.background);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.primary);
  doc.text('Professional Disclaimer', margin + 4, y + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.textMuted);
  const profLines = wrapText(prediction.professionalDisclaimer, contentWidth - 8);
  for (let i = 0; i < Math.min(profLines.length, 5); i++) {
    doc.text(profLines[i], margin + 4, y + 14 + (i * 3.5));
  }
  y += 35;
  
  // Legal disclaimer
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.border);
  doc.roundedRect(margin, y, contentWidth, 45, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.danger);
  doc.text('Legal Disclaimer', margin + 4, y + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.textMuted);
  const legalLines = wrapText(prediction.legalDisclaimer, contentWidth - 8);
  for (let i = 0; i < Math.min(legalLines.length, 10); i++) {
    doc.text(legalLines[i], margin + 4, y + 14 + (i * 3.5));
  }
  y += 50;
  
  // Analysis methodology note
  checkPageBreak(35);
  setFillColor(COLORS.secondary);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text('Analysis Methodology', margin + 4, y + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const methodologyText = 'This report utilizes AI-powered analysis combining technical indicators, price action patterns, and probabilistic modeling. Technical indicators including RSI, MACD, and Moving Averages are estimated based on available price data and market trends. All predictions are probability-weighted and should not be construed as guaranteed outcomes. Past performance does not indicate future results.';
  const methLines = wrapText(methodologyText, contentWidth - 8);
  for (let i = 0; i < Math.min(methLines.length, 5); i++) {
    doc.text(methLines[i], margin + 4, y + 14 + (i * 3.5));
  }
  
  // Final footer
  addPageFooter();
  
  // Save the PDF
  doc.save(`${prediction.symbol}_Institutional_Research_Report.pdf`);
}
