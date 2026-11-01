import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import {
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText,
  Share2,
  ExternalLink,
  ShieldCheck,
  Building2,
  Globe2,
} from 'lucide-react';

interface StockHeaderProps {
  quote: StockQuote;
  market: 'IN' | 'US';
  onMarketChange: (m: 'IN' | 'US') => void;
  onSearchTicker: (ticker: string) => void;
  onRunAnalysis: () => void;
  onOpenCustomReportModal: () => void;
  isAnalyzing: boolean;
  isDataLoading: boolean;
  onRefreshData: () => void;
}

const INDIAN_POPULAR_TICKERS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'TATAMOTORS',
  'BHARTIARTL',
  'ITC',
  'SBIN',
  'LICI',
  'BAJFINANCE',
  'ZOMATO',
];

const US_POPULAR_TICKERS = [
  'NVDA',
  'AAPL',
  'TSLA',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'AMD',
  'PLTR',
  'COIN',
];

export const StockHeader: React.FC<StockHeaderProps> = ({
  quote,
  market,
  onMarketChange,
  onSearchTicker,
  onRunAnalysis,
  onOpenCustomReportModal,
  isAnalyzing,
  isDataLoading,
  onRefreshData,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const curr = quote.currencySymbol || (market === 'IN' ? '₹' : '$');
  const isIndianMarket = market === 'IN' || quote.market === 'IN' || quote.currency === 'INR';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      let cleanInput = searchInput.trim().toUpperCase();
      // If Indian market and no dot specified, auto append .NS for seamless Yahoo chart resolution
      if (market === 'IN' && !cleanInput.includes('.')) {
        cleanInput = `${cleanInput}.NS`;
      }
      onSearchTicker(cleanInput);
      setSearchInput('');
    }
  };

  const isUp = quote.change >= 0;

  // Day Range percentage
  const dayRangeSpread = quote.dayHigh - quote.dayLow || 1;
  const dayPosition = Math.min(100, Math.max(0, ((quote.price - quote.dayLow) / dayRangeSpread) * 100));

  // 52-Week Range percentage
  const yearSpread = quote.yearHigh - quote.yearLow || 1;
  const yearPosition = Math.min(100, Math.max(0, ((quote.price - quote.yearLow) / yearSpread) * 100));

  const formatMarketCap = (cap: number) => {
    if (isIndianMarket) {
      if (cap >= 1e12) return `₹${(cap / 1e12).toFixed(2)} Lakh Cr`;
      if (cap >= 1e7) return `₹${(cap / 1e7).toFixed(2)} Cr`;
      return `₹${cap.toLocaleString('en-IN')}`;
    }
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const popularList = market === 'IN' ? INDIAN_POPULAR_TICKERS : US_POPULAR_TICKERS;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* 1. Market Selection Switcher & Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Market Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onMarketChange('IN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              market === 'IN'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="text-sm">🇮🇳</span>
            <span>Indian Stocks (BSE / NSE)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">₹ INR</span>
          </button>

          <button
            type="button"
            onClick={() => onMarketChange('US')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              market === 'US'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="text-sm">🇺🇸</span>
            <span>US Stocks (NASDAQ / NYSE)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">$ USD</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg ${
              isAnalyzing
                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-95'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin text-blue-300' : 'text-amber-300'}`} />
            <span>{isAnalyzing ? 'Synthesizing Reports...' : 'Run AI Deep Analysis'}</span>
          </button>

          <button
            onClick={onOpenCustomReportModal}
            className="px-3 py-2 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            title="Add your own broker report or expert note"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Add Custom</span> Report
          </button>

          <button
            onClick={onRefreshData}
            disabled={isDataLoading}
            className="p-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl transition-colors"
            title="Refresh Quotes"
          >
            <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Ticker Search Input */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
          placeholder={
            market === 'IN'
              ? 'Search Indian stock (e.g. RELIANCE, TCS, HDFCBANK, INFY, TATAMOTORS, 500325)...'
              : 'Search US stock (e.g. NVDA, AAPL, TSLA, MSFT, GOOGL, AMZN)...'
          }
          className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Analyze
        </button>
      </form>

      {/* 3. Popular Ticker Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-slate-500 font-semibold whitespace-nowrap mr-1 flex items-center gap-1">
          <span>{market === 'IN' ? 'Top Indian Stocks:' : 'Top US Stocks:'}</span>
        </span>
        {popularList.map((sym) => {
          const isSelected =
            quote.ticker === sym ||
            quote.ticker === `${sym}.NS` ||
            quote.ticker === `${sym}.BO`;
          return (
            <button
              key={sym}
              onClick={() => onSearchTicker(market === 'IN' ? `${sym}.NS` : sym)}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium border transition-colors whitespace-nowrap ${
                isSelected
                  ? market === 'IN'
                    ? 'bg-orange-950/80 text-orange-400 border-orange-700/80 font-bold'
                    : 'bg-blue-950/80 text-blue-400 border-blue-700/80 font-bold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {sym}
            </button>
          );
        })}
      </div>

      {/* 4. Live Quote Banner */}
      <div className="pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Company & Price */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              {quote.ticker.replace('.NS', '').replace('.BO', '')}
            </h1>
            <span className="text-sm sm:text-base font-bold text-slate-200">
              {quote.name}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {quote.exchange || (market === 'IN' ? 'NSE' : 'NASDAQ')}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {quote.currency || (market === 'IN' ? 'INR' : 'USD')}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {curr}{quote.price.toFixed(2)}
            </span>
            <div
              className={`flex items-center gap-1 text-sm sm:text-base font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                isUp
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isUp ? '+' : ''}{curr}{quote.change.toFixed(2)} ({isUp ? '+' : ''}
                {quote.changePercent.toFixed(2)}%)
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {isIndianMarket ? 'Indian Rupee (₹) Real-Time' : 'USD ($) Real-Time'}
            </span>
          </div>
        </div>

        {/* Right: Key Mini Ranges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <div className="text-slate-400 text-[11px] mb-1">Day Range</div>
            <div className="font-mono text-slate-200 font-semibold mb-1">
              {curr}{quote.dayLow.toFixed(2)} - {curr}{quote.dayHigh.toFixed(2)}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${dayPosition}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px] mb-1">52-Week Range</div>
            <div className="font-mono text-slate-200 font-semibold mb-1">
              {curr}{quote.yearLow.toFixed(2)} - {curr}{quote.yearHigh.toFixed(2)}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${yearPosition}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px] mb-0.5">Market Cap</div>
            <div className="font-mono text-slate-200 font-bold text-sm">
              {formatMarketCap(quote.marketCap)}
            </div>
            <div className="text-[10px] text-slate-500">P/E: {quote.peRatio ? quote.peRatio.toFixed(1) : 'N/A'}</div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px] mb-0.5">Sector</div>
            <div className="text-slate-200 font-semibold truncate max-w-[110px]" title={quote.sector}>
              {quote.sector}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[110px]" title={quote.industry}>
              {quote.industry}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
