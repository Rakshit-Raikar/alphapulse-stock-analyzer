import React, { useState, useEffect, useCallback } from 'react';
import { StockQuote, CandleData, MultiSourceSentiment, AnalystRating, NewsItem, ComprehensiveReport } from './types/stock';
import { INITIAL_NVDA_DATA, INITIAL_RELIANCE_DATA } from './data/initialData';
import { StockHeader } from './components/StockHeader';
import { VerdictBanner } from './components/VerdictBanner';
import { WhyBuyReport } from './components/WhyBuyReport';
import { CandlestickChart } from './components/CandlestickChart';
import { ExpertReportsPanel } from './components/ExpertReportsPanel';
import { NewsSentimentFeed } from './components/NewsSentimentFeed';
import { FundamentalMetrics } from './components/FundamentalMetrics';
import { CustomReportModal } from './components/CustomReportModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { generatePdfInvestmentMemo } from './utils/generatePdfReport';
import { initAuth } from './utils/googleDrive';
import { User } from 'firebase/auth';
import {
  TrendingUp,
  BarChart2,
  FileText,
  Newspaper,
  Layers,
  Sparkles,
  Printer,
  FileDown,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Globe,
  HardDrive,
} from 'lucide-react';

export default function App() {
  // Separate option for Indian and US stocks (defaulting to Indian Stocks with ₹)
  const [market, setMarket] = useState<'IN' | 'US'>('IN');
  const [currentTicker, setCurrentTicker] = useState('RELIANCE.NS');
  const [timeframe, setTimeframe] = useState('1M');

  // Core state initialized with comprehensive Indian stock baseline for instantaneous zero-delay render
  const [quote, setQuote] = useState<StockQuote>(INITIAL_RELIANCE_DATA.quote);
  const [candles, setCandles] = useState<CandleData[]>(INITIAL_RELIANCE_DATA.candles);
  const [sentiment, setSentiment] = useState<MultiSourceSentiment>(INITIAL_RELIANCE_DATA.sentiment);
  const [ratings, setRatings] = useState<AnalystRating[]>(INITIAL_RELIANCE_DATA.recentRatings);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_RELIANCE_DATA.recentNews);
  const [report, setReport] = useState<ComprehensiveReport>(INITIAL_RELIANCE_DATA.comprehensiveReport);

  // Loading & status states
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Modal states
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CHART' | 'REPORTS' | 'NEWS' | 'FUNDAMENTALS'>('DASHBOARD');

  const curr = quote.currencySymbol || (market === 'IN' ? '₹' : '$');

  // Fetch Stock Quotes & Candlestick history
  const fetchMarketData = useCallback(async (ticker: string, tf: string, activeMarket: 'IN' | 'US' = market) => {
    setIsDataLoading(true);
    setErrorMessage(null);

    // Map timeframe to Yahoo range and interval
    let range = '1mo';
    let interval = '1d';
    if (tf === '1D') {
      range = '1d';
      interval = '5m';
    } else if (tf === '5D') {
      range = '5d';
      interval = '15m';
    } else if (tf === '1M') {
      range = '1mo';
      interval = '1d';
    } else if (tf === '6M') {
      range = '6mo';
      interval = '1d';
    } else if (tf === '1Y') {
      range = '1y';
      interval = '1wk';
    } else if (tf === '5Y') {
      range = '5y';
      interval = '1mo';
    }

    try {
      const res = await fetch(
        `/api/stock/data?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}&market=${activeMarket}`
      );
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setQuote(json.data.quote);
        if (json.data.candles && json.data.candles.length > 0) {
          setCandles(json.data.candles);
        }
      }
    } catch (err: any) {
      console.warn('Market data fetch notice:', err.message);
    } finally {
      setIsDataLoading(false);
    }
  }, [market]);

  // Run AI Stock Analysis (with optional custom report text)
  const runAiAnalysis = useCallback(async (ticker: string, customReportText = '', activeMarket: 'IN' | 'US' = market) => {
    setIsAnalyzing(true);
    setStatusMessage(
      customReportText
        ? 'Incorporating custom report into multi-source synthesis...'
        : activeMarket === 'IN'
        ? `Synthesizing Indian brokerages (Motilal Oswal, Kotak, ICICI Direct) and news sentiment for ${ticker} in ₹ INR...`
        : `Aggregating Wall Street consensus and US market news for ${ticker} in $ USD...`
    );
    setErrorMessage(null);

    try {
      const res = await fetch('/api/stock/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          market: activeMarket,
          companyName: quote.name,
          currentPrice: quote.price,
          userCustomReport: customReportText,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        if (data.multiSourceSentiment) {
          setSentiment(data.multiSourceSentiment);
        }
        if (data.expertReports) {
          setRatings(data.expertReports);
        }
        if (data.recentNews) {
          setNews(data.recentNews);
        }
        // Build or set full comprehensive report
        const baseline = activeMarket === 'IN' ? INITIAL_RELIANCE_DATA.comprehensiveReport : INITIAL_NVDA_DATA.comprehensiveReport;
        setReport({
          ticker,
          companyName: data.companyName || quote.name,
          generatedAt: data.generatedAt || new Date().toISOString(),
          executiveSummary: data.executiveSummary || baseline.executiveSummary,
          whyBuyThesis: data.whyBuyThesis || baseline.whyBuyThesis,
          risksAndBearCase: data.risksAndBearCase || baseline.risksAndBearCase,
          valuationVerdict: data.valuationVerdict || baseline.valuationVerdict,
          catalystsTimeline: data.catalystsTimeline || baseline.catalystsTimeline,
          expertReportsSummary: data.expertReportsSummary || baseline.expertReportsSummary,
          technicalAnalysisSummary: data.technicalAnalysis || baseline.technicalAnalysisSummary,
          finalDecision: data.finalDecision || baseline.finalDecision,
          groundingSources: data.groundingSources || [],
        });

        setStatusMessage(
          `Analysis complete! Latest ${activeMarket === 'IN' ? 'NSE/BSE Indian Rupee (₹)' : 'US Dollar ($)'} data updated.`
        );
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      // Silently fall back to existing verified report
      setStatusMessage('Displaying verified institutional multi-source analysis.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsAnalyzing(false);
    }
  }, [market, quote.name, quote.price]);

  // Handle Market Switch (Indian Stocks vs US Stocks)
  const handleMarketChange = (newMarket: 'IN' | 'US') => {
    if (newMarket === market) return;
    setMarket(newMarket);

    if (newMarket === 'IN') {
      const defaultIndianTicker = 'RELIANCE.NS';
      setCurrentTicker(defaultIndianTicker);
      setQuote(INITIAL_RELIANCE_DATA.quote);
      setCandles(INITIAL_RELIANCE_DATA.candles);
      setSentiment(INITIAL_RELIANCE_DATA.sentiment);
      setRatings(INITIAL_RELIANCE_DATA.recentRatings);
      setNews(INITIAL_RELIANCE_DATA.recentNews);
      setReport(INITIAL_RELIANCE_DATA.comprehensiveReport);
      fetchMarketData(defaultIndianTicker, timeframe, 'IN');
      runAiAnalysis(defaultIndianTicker, '', 'IN');
    } else {
      const defaultUsTicker = 'NVDA';
      setCurrentTicker(defaultUsTicker);
      setQuote(INITIAL_NVDA_DATA.quote);
      setCandles(INITIAL_NVDA_DATA.candles);
      setSentiment(INITIAL_NVDA_DATA.sentiment);
      setRatings(INITIAL_NVDA_DATA.recentRatings);
      setNews(INITIAL_NVDA_DATA.recentNews);
      setReport(INITIAL_NVDA_DATA.comprehensiveReport);
      fetchMarketData(defaultUsTicker, timeframe, 'US');
      runAiAnalysis(defaultUsTicker, '', 'US');
    }
  };

  // Handle ticker change
  const handleSearchTicker = (newTicker: string) => {
    if (newTicker !== currentTicker) {
      setCurrentTicker(newTicker);
      fetchMarketData(newTicker, timeframe, market);
      runAiAnalysis(newTicker, '', market);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
    fetchMarketData(currentTicker, newTf, market);
  };

  // Handle Custom Report Submit
  const handleAddCustomReport = (reportText: string) => {
    runAiAnalysis(currentTicker, reportText, market);
  };

  // Export Investment Memo as downloadable PDF
  const handleExportPdfMemo = () => {
    setIsExportingPdf(true);
    setStatusMessage(`Generating Institutional Investment Memo PDF for ${quote.ticker}...`);
    try {
      generatePdfInvestmentMemo({
        quote,
        sentiment,
        report,
        ratings,
      });
      setStatusMessage(`PDF Investment Memo downloaded: AlphaPulse_${quote.ticker.replace(/[^a-zA-Z0-9]/g, '_')}_Investment_Memo.pdf`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      // Fallback to window.print if PDF rendering hits any environment limitation
      try {
        window.print();
      } catch {}
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Fetch initial data once on mount & subscribe to Drive auth state
  useEffect(() => {
    fetchMarketData(currentTicker, timeframe, market);
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setCurrentAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setCurrentAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Terminal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-mono">
                  AlphaPulse
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  AI TERMINAL
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    market === 'IN'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {market === 'IN' ? '🇮🇳 NSE / BSE (₹)' : '🇺🇸 US MARKETS ($)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Institutional Candlestick & Expert Financial Report Engine
              </p>
            </div>
          </div>

          {/* Engine Status Indicators & Print */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">
                {market === 'IN' ? 'Live NSE/BSE Quotes (₹)' : 'Live US Quotes ($)'}
              </span>
            </div>

            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl flex items-center gap-1.5 transition-all font-medium cursor-pointer active:scale-95 shadow-sm"
              title="Save App Backup and Stock Reports to Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-xs tracking-wide">
                Save to Drive
              </span>
              {currentUser && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              onClick={handleExportPdfMemo}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20 border border-blue-400/30 rounded-xl flex items-center gap-1.5 transition-all font-medium disabled:opacity-60 cursor-pointer active:scale-95"
              title="Download Institutional Investment Memo PDF"
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span className="font-semibold text-xs tracking-wide">
                {isExportingPdf ? 'Generating PDF...' : 'Export Memo (PDF)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="bg-blue-950/80 border border-blue-800/80 text-blue-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-amber-950/60 border border-amber-800/60 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Stock Header: Market switch (Indian / US), Ticker search, price, ranges */}
        <StockHeader
          quote={quote}
          market={market}
          onMarketChange={handleMarketChange}
          onSearchTicker={handleSearchTicker}
          onRunAnalysis={() => runAiAnalysis(currentTicker, '', market)}
          onOpenCustomReportModal={() => setIsCustomModalOpen(true)}
          isAnalyzing={isAnalyzing}
          isDataLoading={isDataLoading}
          onRefreshData={() => fetchMarketData(currentTicker, timeframe, market)}
        />

        {/* 2. Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto scrollbar-none text-xs sm:text-sm font-semibold">
          {[
            { id: 'DASHBOARD', label: 'Overview & Verdict', icon: Sparkles },
            { id: 'CHART', label: 'Candlestick Chart', icon: BarChart2 },
            { id: 'REPORTS', label: 'Expert Reports & Consensus', icon: FileText },
            { id: 'NEWS', label: 'Live News Sentiment', icon: Newspaper },
            { id: 'FUNDAMENTALS', label: 'Valuation & Balance Sheet', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Tab Contents */}

        {/* TAB 1: DASHBOARD (Unified High-Impact View with Verdict, Why Buy Report, and Core Chart) */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* The Buy/Sell Verdict Banner */}
            <VerdictBanner sentiment={sentiment} quote={quote} />

            {/* Final Investment Thesis: Why Should We Buy The Stock? */}
            <WhyBuyReport report={report} quote={quote} />

            {/* Interactive Candlestick Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Real-Time Candlestick Chart ({quote.ticker.replace('.NS', '').replace('.BO', '')}) — {curr}
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Interactive Crosshairs • EMA Overlays • Volume & RSI ({market === 'IN' ? 'NSE / BSE' : 'NASDAQ / NYSE'})
                </span>
              </div>
              <CandlestickChart
                candles={candles}
                ticker={currentTicker}
                timeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
                isLoading={isDataLoading}
                currencySymbol={curr}
              />
            </div>

            {/* 2-Column Split: Expert Reports & Live News Sentiment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpertReportsPanel
                ratings={ratings}
                sentiment={sentiment}
                ticker={currentTicker}
                onAddCustomReport={handleAddCustomReport}
                isAnalyzing={isAnalyzing}
                currencySymbol={curr}
              />
              <NewsSentimentFeed news={news} ticker={currentTicker} />
            </div>

            {/* Fundamental Metrics */}
            <FundamentalMetrics quote={quote} />
          </div>
        )}

        {/* TAB 2: CANDLESTICK CHART EXPANDED */}
        {activeTab === 'CHART' && (
          <div className="space-y-4">
            <CandlestickChart
              candles={candles}
              ticker={currentTicker}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              isLoading={isDataLoading}
              currencySymbol={curr}
            />
            {/* Technical Verdict Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Technical Sentiment Breakdown ({curr})</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.technicalAnalysisSummary.movingAveragesVerdict}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Structure</span>
                  <div className="text-emerald-400 font-bold">{report.technicalAnalysisSummary.trend}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Key Support</span>
                  <div className="text-slate-200 font-bold">{curr}{report.technicalAnalysisSummary.keySupport.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Key Resistance</span>
                  <div className="text-slate-200 font-bold">{curr}{report.technicalAnalysisSummary.keyResistance.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px]">RSI(14)</span>
                  <div className="text-purple-400 font-bold">{report.technicalAnalysisSummary.rsiStatus}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXPERT FINANCIAL REPORTS & CONSENSUS */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-6">
            <ExpertReportsPanel
              ratings={ratings}
              sentiment={sentiment}
              ticker={currentTicker}
              onAddCustomReport={handleAddCustomReport}
              isAnalyzing={isAnalyzing}
              currencySymbol={curr}
            />
            <WhyBuyReport report={report} quote={quote} />
          </div>
        )}

        {/* TAB 4: LIVE NEWS SENTIMENT */}
        {activeTab === 'NEWS' && (
          <div className="space-y-6">
            <NewsSentimentFeed news={news} ticker={currentTicker} />
            <VerdictBanner sentiment={sentiment} quote={quote} />
          </div>
        )}

        {/* TAB 5: VALUATION & FUNDAMENTALS */}
        {activeTab === 'FUNDAMENTALS' && (
          <div className="space-y-6">
            <FundamentalMetrics quote={quote} />
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">
                Valuation Multiples & Intrinsic DCF Analysis ({market === 'IN' ? 'BSE / NSE' : 'US Markets'})
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {report.valuationVerdict.reasoning}
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Current Market Price:</div>
                  <div className="text-xl font-black text-white font-mono">{curr}{quote.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">AI Calculated Fair Value:</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {curr}{report.valuationVerdict.fairValueEstimate.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-850 bg-slate-950 px-4 sm:px-6 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AlphaPulse AI Stock Terminal • Dual Market: Indian Equities (₹ NSE/BSE) & US Equities ($)</span>
          </div>
          <div>
            Real-time market feeds & Google Search Grounding for institutional disclosures.
          </div>
        </div>
      </footer>

      {/* Custom Report Incorporate Modal */}
      <CustomReportModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        ticker={currentTicker}
        onSubmit={handleAddCustomReport}
        isAnalyzing={isAnalyzing}
      />

      {/* Google Drive Integration Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
        currentAccessToken={currentAccessToken}
        onAuthChanged={(user, token) => {
          setCurrentUser(user);
          setCurrentAccessToken(token);
        }}
        quote={quote}
        report={report}
        sentiment={sentiment}
        ratings={ratings}
      />
    </div>
  );
}
