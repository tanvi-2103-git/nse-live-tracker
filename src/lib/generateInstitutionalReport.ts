import { ResearchPrediction } from '@/types/prediction';
import { Stock } from '@/types/stock';
import { createPDFDocument } from './pdf/documentBuilder';
import { COLORS, RISK_COLORS, SCENARIO_COLORS } from './pdf/colors';
import { sanitizeForPDF } from './pdf/fontLoader';

// Premium Institutional Research Report Generator - Level 3
// Designed to match Goldman Sachs / Motilal Oswal quality
// Fixed: Proper text encoding, no emoji icons, clean paragraph handling

export async function generateInstitutionalReport(prediction: ResearchPrediction, stock: Stock) {
  const pdf = createPDFDocument();
  const { doc, config, setColor, setFillColor, setDrawColor, addNewPage, checkPageBreak, addPageFooter, getY, setY, addY, writeText, writeParagraph, wrapText, drawSectionHeader, drawCard, drawProgressBar } = pdf;
  const { margin, pageWidth, pageHeight, contentWidth } = config;

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
  writeText('INSTITUTIONAL EQUITY RESEARCH', margin, 15);
  
  // Symbol and Company
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  writeText(prediction.symbol, margin, 35);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  writeText(prediction.companyName, margin, 45);
  
  // Exchange badge
  doc.setFontSize(8);
  setFillColor(COLORS.primary);
  doc.roundedRect(margin, 48, 25, 5, 1, 1, 'F');
  setColor(COLORS.cardBg);
  writeText('NSE LISTED', margin + 3, 52);
  
  // Report type
  doc.setFontSize(10);
  setColor(COLORS.textMuted);
  writeText('Comprehensive Technical and Fundamental Analysis', margin, 75);
  
  // Date
  doc.setFontSize(9);
  const reportDate = new Date(prediction.timestamp).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  writeText(`Report Date: ${reportDate}`, margin, 82);
  
  // Verdict Badge
  setY(95);
  const verdictColor = prediction.verdict.trend === 'Bullish' ? COLORS.success : 
                       prediction.verdict.trend === 'Bearish' ? COLORS.danger : COLORS.warning;
  setFillColor(verdictColor);
  doc.roundedRect(margin, getY(), 50, 20, 3, 3, 'F');
  
  doc.setFontSize(8);
  setColor(COLORS.cardBg);
  writeText('OVERALL VERDICT', margin + 5, getY() + 6);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  writeText(prediction.verdict.trend.toUpperCase(), margin + 5, getY() + 15);
  
  // Confidence & Bias cards
  const cardWidth = 45;
  drawCard(margin + 55, cardWidth, 20, 'CONFIDENCE', `${prediction.verdict.confidencePercent}%`, 'AI Analysis Score');
  drawCard(margin + 105, cardWidth, 20, 'ANALYST BIAS', sanitizeForPDF(prediction.verdict.analystBias), sanitizeForPDF(prediction.verdict.outlookHorizon));
  
  setY(125);
  
  // Key Metrics Panel
  setFillColor(COLORS.background);
  doc.roundedRect(margin, getY(), contentWidth, 35, 2, 2, 'F');
  
  const metricsY = getY() + 5;
  const colWidth = contentWidth / 5;
  
  // Current Price
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  writeText('CURRENT PRICE', margin + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  writeText(`Rs.${stock.lastPrice.toLocaleString()}`, margin + 5, metricsY + 8);
  
  // Change
  const changeColor = stock.pChange >= 0 ? COLORS.success : COLORS.danger;
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  writeText('CHANGE', margin + colWidth + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(changeColor);
  writeText(`${stock.pChange >= 0 ? '+' : ''}${stock.pChange.toFixed(2)}%`, margin + colWidth + 5, metricsY + 8);
  
  // 52W High
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  writeText('52W HIGH', margin + colWidth * 2 + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  writeText(`Rs.${stock.yearHigh.toLocaleString()}`, margin + colWidth * 2 + 5, metricsY + 8);
  
  // 52W Low
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  writeText('52W LOW', margin + colWidth * 3 + 5, metricsY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  writeText(`Rs.${stock.yearLow.toLocaleString()}`, margin + colWidth * 3 + 5, metricsY + 8);
  
  // Day Range
  doc.setFontSize(7);
  setColor(COLORS.textMuted);
  writeText('DAY RANGE', margin + colWidth * 4 + 5, metricsY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  writeText(`Rs.${stock.dayLow} - Rs.${stock.dayHigh}`, margin + colWidth * 4 + 5, metricsY + 8);
  
  // Support/Resistance line
  const supportResY = metricsY + 18;
  doc.setFontSize(8);
  setColor(COLORS.textMuted);
  writeText(`Support: Rs.${prediction.priceLevels.support?.toLocaleString() || 'N/A'}`, margin + 5, supportResY);
  writeText(`Resistance: Rs.${prediction.priceLevels.resistance?.toLocaleString() || 'N/A'}`, margin + 60, supportResY);
  writeText(`Trend Strength: ${sanitizeForPDF(prediction.priceLevels.trendStrength)}`, margin + 120, supportResY);
  
  setY(170);
  
  // Executive Summary Box
  drawSectionHeader('EXECUTIVE SUMMARY');
  
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.border);
  doc.roundedRect(margin, getY(), contentWidth, 40, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const summaryLines = wrapText(prediction.executiveSummary, contentWidth - 10);
  let textY = getY() + 6;
  for (let i = 0; i < Math.min(summaryLines.length, 8); i++) {
    doc.text(summaryLines[i], margin + 5, textY);
    textY += 4.5;
  }
  
  addY(48);
  
  // Technical Indicators Quick View
  drawSectionHeader('TECHNICAL INDICATORS SNAPSHOT');
  
  const indicators = prediction.technicalIndicators;
  if (indicators) {
    const indicatorCards = [
      { label: 'RSI STATUS', value: sanitizeForPDF(indicators.rsiStatus), color: indicators.rsiStatus === 'Overbought' ? COLORS.warning : indicators.rsiStatus === 'Oversold' ? COLORS.primary : COLORS.textMuted },
      { label: 'MACD SIGNAL', value: sanitizeForPDF(indicators.macdSignal), color: indicators.macdSignal === 'Bullish' ? COLORS.success : indicators.macdSignal === 'Bearish' ? COLORS.danger : COLORS.warning },
      { label: 'MA TREND', value: sanitizeForPDF(indicators.overallBias), color: indicators.overallBias === 'Bullish' ? COLORS.success : indicators.overallBias === 'Bearish' ? COLORS.danger : COLORS.warning },
    ];
    
    const cardW = (contentWidth - 10) / 3;
    indicatorCards.forEach((card, i) => {
      const x = margin + (cardW + 5) * i;
      setFillColor(COLORS.cardBg);
      setDrawColor(card.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, getY(), cardW, 18, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      doc.setFontSize(7);
      setColor(COLORS.textMuted);
      doc.text(card.label, x + 4, getY() + 6);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(card.color);
      doc.text(card.value, x + 4, getY() + 14);
    });
  }
  
  addY(25);
  
  addPageFooter();
  
  // ==================== PAGE 2: TECHNICAL ANALYSIS ====================
  addNewPage();
  
  drawSectionHeader('DETAILED TECHNICAL ANALYSIS');
  
  // RSI Analysis
  if (indicators) {
    setFillColor(COLORS.cardBg);
    setDrawColor(COLORS.border);
    doc.roundedRect(margin, getY(), contentWidth, 22, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    writeText('RSI (Relative Strength Index)', margin + 4, getY() + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    const rsiLines = wrapText(indicators.rsiReasoning, contentWidth - 8);
    for (let i = 0; i < Math.min(rsiLines.length, 3); i++) {
      doc.text(rsiLines[i], margin + 4, getY() + 12 + (i * 4));
    }
    addY(26);
    
    // MACD Analysis
    setFillColor(COLORS.cardBg);
    setDrawColor(COLORS.border);
    doc.roundedRect(margin, getY(), contentWidth, 22, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    writeText('MACD (Moving Average Convergence Divergence)', margin + 4, getY() + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    const macdLines = wrapText(indicators.macdReasoning, contentWidth - 8);
    for (let i = 0; i < Math.min(macdLines.length, 3); i++) {
      doc.text(macdLines[i], margin + 4, getY() + 12 + (i * 4));
    }
    addY(26);
    
    // Moving Averages
    drawSectionHeader('MOVING AVERAGE ANALYSIS');
    
    const maData = [
      { period: '20-Day MA', analysis: indicators.shortMA, type: 'Short-term Trend' },
      { period: '50-Day MA', analysis: indicators.mediumMA, type: 'Medium-term Trend' },
      { period: '200-Day MA', analysis: indicators.longMA, type: 'Long-term Trend' },
    ];
    
    maData.forEach((ma) => {
      checkPageBreak(18);
      setFillColor(COLORS.background);
      doc.roundedRect(margin, getY(), contentWidth, 16, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.text);
      doc.text(ma.period, margin + 4, getY() + 5);
      
      doc.setFontSize(7);
      setColor(COLORS.textMuted);
      doc.text(ma.type, margin + 45, getY() + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.text);
      const maLines = wrapText(ma.analysis, contentWidth - 8);
      doc.text(maLines[0] || '', margin + 4, getY() + 11);
      
      addY(18);
    });
  }
  
  addY(5);
  
  // Price Structure
  drawSectionHeader('PRICE AND TECHNICAL STRUCTURE');
  
  if (prediction.technicalStructure) {
    const structureItems = Object.entries(prediction.technicalStructure);
    structureItems.forEach(([key, value]) => {
      checkPageBreak(14);
      
      setFillColor(COLORS.cardBg);
      setDrawColor(COLORS.border);
      doc.roundedRect(margin, getY(), contentWidth, 12, 1, 1, 'FD');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.text);
      const lines = wrapText(String(value), contentWidth - 8);
      // Write full paragraph properly
      let lineY = getY() + 5;
      for (let i = 0; i < Math.min(lines.length, 2); i++) {
        doc.text(lines[i], margin + 4, lineY);
        lineY += 4;
      }
      
      addY(14);
    });
  }
  
  // ==================== PAGE 3: SCENARIO ANALYSIS ====================
  addNewPage();
  
  drawSectionHeader('SCENARIO-BASED PROBABILITY FORECAST');
  
  // Probability Matrix Table Header
  setFillColor(COLORS.secondary);
  doc.roundedRect(margin, getY(), contentWidth, 8, 1, 1, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text('SCENARIO', margin + 4, getY() + 5.5);
  doc.text('PROBABILITY', margin + 50, getY() + 5.5);
  doc.text('EXPECTED BEHAVIOR', margin + 85, getY() + 5.5);
  addY(10);
  
  if (prediction.scenarios) {
    const scenarioOrder = ['baseCase', 'bullCase', 'bearCase'] as const;
    
    scenarioOrder.forEach((key) => {
      const scenario = prediction.scenarios[key];
      if (!scenario) return;
      
      checkPageBreak(30);
      
      const color = SCENARIO_COLORS[key];
      
      // Scenario card
      setFillColor(COLORS.cardBg);
      setDrawColor(color);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, getY(), contentWidth, 22, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      // Left accent bar
      setFillColor(color);
      doc.roundedRect(margin, getY(), 3, 22, 1, 1, 'F');
      
      // Scenario name
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      setColor(color);
      writeText(scenario.name, margin + 6, getY() + 6);
      
      // Probability badge
      setFillColor(color);
      doc.roundedRect(margin + 50, getY() + 2, 25, 6, 1, 1, 'F');
      doc.setFontSize(7);
      setColor(COLORS.cardBg);
      writeText(scenario.probability, margin + 54, getY() + 6);
      
      // Expected behavior - full text with proper wrapping
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.text);
      const behaviorLines = wrapText(scenario.expectedBehavior, contentWidth - 12);
      let behaviorY = getY() + 13;
      for (let i = 0; i < Math.min(behaviorLines.length, 2); i++) {
        doc.text(behaviorLines[i], margin + 6, behaviorY);
        behaviorY += 4;
      }
      
      addY(26);
      
      // Key triggers
      if (scenario.keyTriggers && scenario.keyTriggers.length > 0) {
        const triggersText = `Key Triggers: ${scenario.keyTriggers.slice(0, 3).join(' | ')}`;
        doc.setFontSize(7);
        setColor(COLORS.textMuted);
        writeText(triggersText, margin + 6, getY());
        addY(6);
      }
    });
  }
  
  addY(10);
  
  // ==================== RISK DASHBOARD ====================
  drawSectionHeader('RISK ASSESSMENT DASHBOARD');
  
  if (prediction.riskDashboard && prediction.riskDashboard.length > 0) {
    const colW = (contentWidth - 5) / 2;
    prediction.riskDashboard.forEach((risk, i) => {
      const col = i % 2;
      const x = margin + (colW + 5) * col;
      
      if (col === 0) checkPageBreak(18);
      
      const color = RISK_COLORS[risk.level] || COLORS.textMuted;
      
      setFillColor(COLORS.cardBg);
      setDrawColor(color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, getY(), colW, 15, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      // Risk type
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.text);
      writeText(risk.type, x + 4, getY() + 5);
      
      // Level badge
      setFillColor(color);
      doc.roundedRect(x + colW - 20, getY() + 2, 16, 5, 1, 1, 'F');
      doc.setFontSize(6);
      setColor(COLORS.cardBg);
      doc.text(risk.level.toUpperCase(), x + colW - 18, getY() + 5.5);
      
      // Description
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.textMuted);
      const descLines = wrapText(risk.description, colW - 8);
      doc.text(descLines[0] || '', x + 4, getY() + 11);
      
      if (col === 1) addY(18);
    });
    
    if (prediction.riskDashboard.length % 2 !== 0) addY(18);
  }
  
  addY(10);
  
  // ==================== PAGE 4: MULTI-TIMEFRAME & CONCLUSION ====================
  addNewPage();
  
  drawSectionHeader('MULTI-TIMEFRAME OUTLOOK');
  
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
      doc.roundedRect(x, getY(), tfWidth, 28, 2, 2, 'FD');
      doc.setLineWidth(0.2);
      
      // Top accent
      setFillColor(biasColor);
      doc.roundedRect(x, getY(), tfWidth, 3, 2, 2, 'F');
      doc.rect(x, getY() + 2, tfWidth, 1, 'F');
      
      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.textMuted);
      doc.text(tf.label, x + 4, getY() + 9);
      
      // Period
      doc.setFontSize(8);
      setColor(COLORS.text);
      writeText(tf.period, x + 4, getY() + 14);
      
      // Bias
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      setColor(biasColor);
      doc.text(tf.bias.toUpperCase(), x + 4, getY() + 21);
      
      // Outlook text below card
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.textMuted);
      const outlookLines = wrapText(tf.outlook, tfWidth - 4);
      doc.text(outlookLines[0] || '', x + 2, getY() + 32);
    });
    
    addY(45);
  }
  
  // Company Context
  drawSectionHeader('COMPANY AND SECTOR CONTEXT');
  
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.border);
  doc.roundedRect(margin, getY(), contentWidth, 25, 2, 2, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const contextText = prediction.companyContext || 'Company context information not available for this analysis.';
  const contextLines = wrapText(contextText, contentWidth - 8);
  let contextY = getY() + 6;
  for (let i = 0; i < Math.min(contextLines.length, 5); i++) {
    doc.text(contextLines[i], margin + 4, contextY);
    contextY += 4;
  }
  
  addY(30);
  
  // Sector Positioning
  if (prediction.sectorPositioning) {
    setFillColor(COLORS.background);
    doc.roundedRect(margin, getY(), contentWidth, 18, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    doc.text('Sector Positioning:', margin + 4, getY() + 6);
    
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    const sectorLines = wrapText(prediction.sectorPositioning, contentWidth - 8);
    doc.text(sectorLines[0] || '', margin + 4, getY() + 12);
    
    addY(22);
  }
  
  // Final Conclusion
  drawSectionHeader('FINAL CONCLUSION AND RECOMMENDATION');
  
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.primary);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, getY(), contentWidth, 35, 3, 3, 'FD');
  doc.setLineWidth(0.2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const conclusionLines = wrapText(prediction.conclusion, contentWidth - 10);
  let conclusionY = getY() + 7;
  for (let i = 0; i < Math.min(conclusionLines.length, 7); i++) {
    doc.text(conclusionLines[i], margin + 5, conclusionY);
    conclusionY += 4.5;
  }
  
  addY(42);
  
  // Confidence meter
  checkPageBreak(15);
  setFillColor(COLORS.background);
  doc.roundedRect(margin, getY(), contentWidth, 12, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.text);
  doc.text('AI Confidence Score:', margin + 4, getY() + 7);
  
  const confX = margin + 50;
  const confWidth = 80;
  drawProgressBar(confX, confWidth, prediction.verdict.confidencePercent, COLORS.primary);
  
  doc.setFontSize(10);
  setColor(COLORS.primary);
  doc.text(`${prediction.verdict.confidencePercent}%`, confX + confWidth + 5, getY() + 8);
  
  addY(18);
  
  // ==================== DISCLAIMER PAGE ====================
  addNewPage();
  
  // Disclaimer header
  setFillColor(COLORS.secondary);
  doc.roundedRect(margin, getY(), contentWidth, 12, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text('IMPORTANT DISCLAIMERS AND DISCLOSURES', margin + 5, getY() + 8);
  addY(18);
  
  // Risk transparency
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.warning);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, getY(), contentWidth, 25, 2, 2, 'FD');
  doc.setLineWidth(0.2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.warning);
  doc.text('Risk Transparency Statement', margin + 4, getY() + 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.text);
  const riskLines = wrapText(prediction.riskTransparency, contentWidth - 8);
  for (let i = 0; i < Math.min(riskLines.length, 3); i++) {
    doc.text(riskLines[i], margin + 4, getY() + 14 + (i * 4));
  }
  addY(30);
  
  // Professional disclaimer
  setFillColor(COLORS.background);
  doc.roundedRect(margin, getY(), contentWidth, 30, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.primary);
  doc.text('Professional Disclaimer', margin + 4, getY() + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.textMuted);
  const profLines = wrapText(prediction.professionalDisclaimer, contentWidth - 8);
  for (let i = 0; i < Math.min(profLines.length, 5); i++) {
    doc.text(profLines[i], margin + 4, getY() + 14 + (i * 3.5));
  }
  addY(35);
  
  // Legal disclaimer
  setFillColor(COLORS.cardBg);
  setDrawColor(COLORS.border);
  doc.roundedRect(margin, getY(), contentWidth, 45, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.danger);
  doc.text('Legal Disclaimer', margin + 4, getY() + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor(COLORS.textMuted);
  const legalLines = wrapText(prediction.legalDisclaimer, contentWidth - 8);
  for (let i = 0; i < Math.min(legalLines.length, 10); i++) {
    doc.text(legalLines[i], margin + 4, getY() + 14 + (i * 3.5));
  }
  addY(50);
  
  // Analysis methodology note
  checkPageBreak(35);
  setFillColor(COLORS.secondary);
  doc.roundedRect(margin, getY(), contentWidth, 30, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setColor(COLORS.cardBg);
  doc.text('Analysis Methodology', margin + 4, getY() + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const methodologyText = 'This report utilizes AI-powered analysis combining technical indicators, price action patterns, and probabilistic modeling. Technical indicators including RSI, MACD, and Moving Averages are estimated based on available price data and market trends. All predictions are probability-weighted and should not be construed as guaranteed outcomes. Past performance does not indicate future results.';
  const methLines = wrapText(methodologyText, contentWidth - 8);
  for (let i = 0; i < Math.min(methLines.length, 5); i++) {
    doc.text(methLines[i], margin + 4, getY() + 14 + (i * 3.5));
  }
  
  // Final footer
  addPageFooter();
  
  // Save the PDF
  pdf.save(`${prediction.symbol}_Institutional_Research_Report.pdf`);
}
