export interface CandleData {
  time: string; // ISO or date label
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  currencySymbol: string;
  market: 'IN' | 'US';
  updatedAt: string;
}

export interface AnalystRating {
  firm: string;
  analyst?: string;
  action: 'Buy' | 'Strong Buy' | 'Hold' | 'Underperform' | 'Sell';
  targetPrice: number;
  priorTargetPrice?: number;
  date: string;
  summary: string;
  sourceUrl?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number; // -1 to +1
  url?: string;
  impactWeight: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MultiSourceSentiment {
  overallScore: number; // 0 to 100
  overallVerdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidenceLevel: number; // 0 to 100
  expertAnalystScore: number; // 0 to 100
  newsMediaScore: number; // 0 to 100
  technicalScore: number; // 0 to 100
  fundamentalScore: number; // 0 to 100
  consensusPriceTarget: {
    low: number;
    median: number;
    high: number;
    impliedUpsideMedianPercent: number;
    impliedUpsideHighPercent: number;
    totalRatingsCount: number;
    distribution: {
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    };
  };
}

export interface ComprehensiveReport {
  ticker: string;
  companyName: string;
  generatedAt: string;
  executiveSummary: string;
  whyBuyThesis: {
    headline: string;
    keyPoints: string[];
    competitiveMoat: string;
    financialHealthReview: string;
  };
  risksAndBearCase: {
    headline: string;
    keyRisks: string[];
    downsideSupportLevel: string;
  };
  valuationVerdict: {
    assessment: 'Undervalued' | 'Fair Value' | 'Overvalued';
    reasoning: string;
    fairValueEstimate: number;
  };
  catalystsTimeline: {
    event: string;
    expectedTiming: string;
    potentialImpact: 'Positive' | 'High Risk' | 'Binary';
  }[];
  expertReportsSummary: {
    source: string;
    headline: string;
    verdict: string;
    keyTakeaway: string;
  }[];
  technicalAnalysisSummary: {
    trend: 'Strong Uptrend' | 'Uptrend' | 'Consolidation' | 'Downtrend' | 'Strong Downtrend';
    keySupport: number;
    keyResistance: number;
    rsiStatus: string;
    movingAveragesVerdict: string;
  };
  finalDecision: {
    action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    convictionPercent: number;
    targetHorizon: string; // e.g. "6 - 12 Months"
    recommendedAllocation: string; // e.g. "Core Portfolio (3-5%)"
    summaryOneLiner: string;
  };
  groundingSources?: {
    title: string;
    url: string;
  }[];
}

export interface FullStockAnalysisData {
  quote: StockQuote;
  candles: CandleData[];
  timeframe: string;
  sentiment: MultiSourceSentiment;
  recentRatings: AnalystRating[];
  recentNews: NewsItem[];
  comprehensiveReport: ComprehensiveReport;
}
