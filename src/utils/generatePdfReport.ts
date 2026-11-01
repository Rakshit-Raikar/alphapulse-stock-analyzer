import { jsPDF } from 'jspdf';
import { StockQuote, MultiSourceSentiment, ComprehensiveReport, AnalystRating } from '../types/stock';

interface ExportPdfParams {
  quote: StockQuote;
  sentiment: MultiSourceSentiment;
  report: ComprehensiveReport;
  ratings?: AnalystRating[];
}

export function buildPdfDocument({
  quote,
  sentiment,
  report,
  ratings = [],
}: ExportPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryNavy = [15, 23, 42]; // #0f172a
  const accentBlue = [37, 99, 235]; // #2563eb
  const emeraldGreen = [16, 185, 129]; // #10b981
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const bgLight = [248, 250, 252]; // #f8fafc
  const borderLight = [226, 232, 240]; // #e2e8f0

  const isIndian = quote.market === 'IN' || quote.ticker.includes('.NS') || quote.ticker.includes('.BO');
  const currency = isIndian ? 'INR (Rs.)' : 'USD ($)';
  const currSymbol = isIndian ? 'Rs. ' : '$';

  // Helper for adding new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(margin, y, contentWidth, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`ALPHAPULSE INSTITUTIONAL RESEARCH | ${quote.ticker} MEMO`, margin + 8, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }), pageWidth - margin - 8, y + 15, { align: 'right' });
    y += 34;
  };

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, y, contentWidth, 68, 4, 4, 'F');

  // Title & Subtitle inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AlphaPulse Institutional Equity Research', margin + 16, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`CONFIDENTIAL INVESTMENT MEMORANDUM | ${isIndian ? 'INDIA EQUITIES (NSE / BSE)' : 'US EQUITIES (NASDAQ / NYSE)'}`, margin + 16, y + 46);

  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Date: ${timestamp}`, pageWidth - margin - 16, y + 46, { align: 'right' });

  y += 82;

  // Company Overview Bar
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(quote.name, margin + 14, y + 24);

  doc.setFontSize(10);
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text(`${quote.ticker} | ${quote.exchange || (isIndian ? 'NSE' : 'NASDAQ')} | Sector: ${quote.sector || 'Equities'}`, margin + 14, y + 42);

  // Price box on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const formattedPrice = `${currSymbol}${quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  doc.text(formattedPrice, pageWidth - margin - 14, y + 24, { align: 'right' });

  doc.setFontSize(10);
  const isPositive = quote.change >= 0;
  if (isPositive) {
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  } else {
    doc.setTextColor(239, 68, 68); // Red
  }
  const changeText = `${isPositive ? '+' : ''}${currSymbol}${quote.change.toFixed(2)} (${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%)`;
  doc.text(changeText, pageWidth - margin - 14, y + 42, { align: 'right' });

  y += 66;

  // Investment Recommendation Card
  checkPageBreak(90);
  const verdict = sentiment.overallVerdict.replace('_', ' ');
  const verdictBg = [236, 253, 245]; // Emerald 50
  const verdictBorder = [167, 243, 208]; // Emerald 200

  doc.setFillColor(verdictBg[0], verdictBg[1], verdictBg[2]);
  doc.setDrawColor(verdictBorder[0], verdictBorder[1], verdictBorder[2]);
  doc.roundedRect(margin, y, contentWidth, 76, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('FINAL INVESTMENT VERDICT', margin + 14, y + 20);

  doc.setFontSize(20);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(verdict, margin + 14, y + 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Conviction: ${sentiment.confidenceLevel}% | Action: ${report.finalDecision.action.replace('_', ' ')}`, margin + 14, y + 62);

  // Targets column
  const targets = sentiment.consensusPriceTarget;
  const colX = margin + contentWidth * 0.52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('12-Month Target Range:', colX, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Median: ${currSymbol}${targets.median.toLocaleString()} (+${targets.impliedUpsideMedianPercent}%)`, colX, y + 36);
  doc.text(`Bull Case: ${currSymbol}${targets.high.toLocaleString()} (+${targets.impliedUpsideHighPercent}%)`, colX, y + 50);
  doc.text(`Support / Floor: ${currSymbol}${targets.low.toLocaleString()}`, colX, y + 64);

  y += 88;

  // Sentiment Breakdown (4 Pillars)
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('MULTI-SOURCE SENTIMENT MATRIX (0 - 100)', margin, y + 10);
  y += 18;

  const pillarWidth = (contentWidth - 18) / 4;
  const pillars = [
    { title: 'Analyst Consensus', score: sentiment.expertAnalystScore },
    { title: 'News Sentiment', score: sentiment.newsMediaScore },
    { title: 'Technical Trend', score: sentiment.technicalScore },
    { title: 'Fundamental Value', score: sentiment.fundamentalScore },
  ];

  pillars.forEach((p, idx) => {
    const px = margin + idx * (pillarWidth + 6);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(px, y, pillarWidth, 36, 3, 3, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(p.title, px + 6, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.text(`${p.score}/100`, px + 6, y + 28);
  });

  y += 48;

  // Executive Summary
  checkPageBreak(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('EXECUTIVE INVESTMENT SUMMARY', margin, y + 10);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const execLines = doc.splitTextToSize(report.executiveSummary, contentWidth);
  doc.text(execLines, margin, y);
  y += execLines.length * 12 + 10;

  // Why Buy Thesis - Core Drivers
  checkPageBreak(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`CORE INVESTMENT THESIS: ${report.whyBuyThesis.headline}`, margin, y + 10);
  y += 20;

  report.whyBuyThesis.keyPoints.slice(0, 4).forEach((point) => {
    checkPageBreak(30);
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.circle(margin + 4, y + 4, 2.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const pointLines = doc.splitTextToSize(point, contentWidth - 16);
    doc.text(pointLines, margin + 14, y + 6);
    y += pointLines.length * 11 + 6;
  });

  // Competitive Moat & Balance Sheet
  checkPageBreak(70);
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('COMPETITIVE MOAT & MARKET POSITION', margin + 10, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const moatLines = doc.splitTextToSize(report.whyBuyThesis.competitiveMoat, contentWidth - 20);
  doc.text(moatLines.slice(0, 2), margin + 10, y + 28);

  y += 64;

  // Institutional Brokerage Consensus Table
  if (ratings && ratings.length > 0) {
    checkPageBreak(110);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('INSTITUTIONAL BROKERAGE RATINGS & TARGETS', margin, y + 10);
    y += 18;

    // Table Header
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('FIRM / BROKERAGE', margin + 8, y + 12);
    doc.text('ACTION', margin + 180, y + 12);
    doc.text(`TARGET (${currSymbol.trim()})`, margin + 280, y + 12);
    doc.text('RESEARCH SUMMARY', margin + 370, y + 12);
    y += 18;

    ratings.slice(0, 4).forEach((r, idx) => {
      checkPageBreak(22);
      doc.setFillColor(idx % 2 === 0 ? 255 : bgLight[0], idx % 2 === 0 ? 255 : bgLight[1], idx % 2 === 0 ? 255 : bgLight[2]);
      doc.rect(margin, y, contentWidth, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(r.firm.slice(0, 30), margin + 8, y + 13);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
      doc.text(r.action, margin + 180, y + 13);

      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.text(`${currSymbol}${r.targetPrice.toLocaleString()}`, margin + 280, y + 13);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      const summarySnippet = r.summary.length > 40 ? r.summary.slice(0, 40) + '...' : r.summary;
      doc.text(summarySnippet, margin + 370, y + 13);

      y += 20;
    });

    y += 10;
  }

  // Key Risks & Invalidation Floor
  checkPageBreak(70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RISK FACTORS & MARGIN OF SAFETY', margin, y + 10);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  report.risksAndBearCase.keyRisks.slice(0, 2).forEach((risk) => {
    const riskLines = doc.splitTextToSize(`* ${risk}`, contentWidth);
    doc.text(riskLines, margin, y);
    y += riskLines.length * 10 + 4;
  });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Downside Floor: ${report.risksAndBearCase.downsideSupportLevel}`, margin, y + 4);
  y += 18;

  // Valuation Assessment & Disclaimer Footer
  checkPageBreak(50);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Valuation Verdict: ', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.valuationVerdict.assessment} | Intrinsic Fair Value Estimate: ${currSymbol}${report.valuationVerdict.fairValueEstimate.toLocaleString()} ${currency}`, margin + 80, y);
  y += 14;

  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('DISCLAIMER: Generated by AlphaPulse AI Equity Terminal for educational and institutional research reference only. Not financial advice.', margin, y);

  return doc;
}

export function generatePdfInvestmentMemo(params: ExportPdfParams): void {
  const doc = buildPdfDocument(params);
  const cleanTicker = params.quote.ticker.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`AlphaPulse_${cleanTicker}_Investment_Memo.pdf`);
}

export function createPdfBlob(params: ExportPdfParams): Blob {
  const doc = buildPdfDocument(params);
  return doc.output('blob');
}
