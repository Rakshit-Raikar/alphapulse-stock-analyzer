import React from 'react';
import { MultiSourceSentiment, StockQuote } from '../types/stock';
import {
  TrendingUp,
  Target,
  BarChart3,
  Newspaper,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';

interface VerdictBannerProps {
  sentiment: MultiSourceSentiment;
  quote: StockQuote;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({ sentiment, quote }) => {
  const verdict = sentiment.overallVerdict;

  const getVerdictStyle = (v: string) => {
    switch (v) {
      case 'STRONG_BUY':
        return {
          label: 'STRONG BUY',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950 font-black',
          glow: 'shadow-emerald-500/20',
          desc: 'Overwhelming confluence across expert reports, news sentiment, and financial fundamentals.',
        };
      case 'BUY':
        return {
          label: 'BUY',
          bg: 'bg-teal-500/15',
          border: 'border-teal-500/40',
          text: 'text-teal-400',
          badge: 'bg-teal-500 text-slate-950 font-black',
          glow: 'shadow-teal-500/20',
          desc: 'Positive expert consensus, healthy financials, and favorable risk-to-reward ratio.',
        };
      case 'HOLD':
        return {
          label: 'HOLD / NEUTRAL',
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-slate-950 font-black',
          glow: 'shadow-amber-500/20',
          desc: 'Balanced risk/reward. Valuation or near-term headwinds suggest waiting for better entry.',
        };
      case 'SELL':
        return {
          label: 'SELL',
          bg: 'bg-orange-500/15',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          badge: 'bg-orange-500 text-slate-950 font-black',
          glow: 'shadow-orange-500/20',
          desc: 'Deteriorating fundamentals, negative expert revisions, or steep valuation multiples.',
        };
      case 'STRONG_SELL':
      default:
        return {
          label: 'STRONG SELL',
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          badge: 'bg-rose-500 text-white font-black',
          glow: 'shadow-rose-500/20',
          desc: 'Extreme risk profile, broad expert downgrades, and acute downside vulnerability.',
        };
    }
  };

  const currentStyle = getVerdictStyle(verdict);
  const pt = sentiment.consensusPriceTarget;

  // Implied upside relative to current price
  const medianUpside = pt.median && quote.price
    ? Number((((pt.median - quote.price) / quote.price) * 100).toFixed(1))
    : pt.impliedUpsideMedianPercent;

  const highUpside = pt.high && quote.price
    ? Number((((pt.high - quote.price) / quote.price) * 100).toFixed(1))
    : pt.impliedUpsideHighPercent;

  // Target price slider position
  const targetSpread = (pt.high - pt.low) || 1;
  const currentPosInTarget = Math.min(100, Math.max(0, ((quote.price - pt.low) / targetSpread) * 100));
  const medianPosInTarget = Math.min(100, Math.max(0, ((pt.median - pt.low) / targetSpread) * 100));

  const curr = quote.currencySymbol || (quote.market === 'IN' ? '₹' : '$');
  const isIndian = quote.market === 'IN' || quote.currency === 'INR';

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-2xl relative overflow-hidden ${currentStyle.bg} ${currentStyle.border} ${currentStyle.glow}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-1">
        {/* Left: Final Verdict & Action Badge */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              AI Synthesis Recommendation
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isIndian ? 'BSE / NSE Indian Equity Engine' : 'Institutional Multi-Source Engine'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-1.5 rounded-xl text-lg sm:text-2xl tracking-wide uppercase ${currentStyle.badge} shadow-lg flex items-center gap-2`}>
              <Flame className="w-5 h-5 fill-current" />
              <span>{currentStyle.label}</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Conviction:</span>
              <span className="text-base font-extrabold text-white font-mono">
                {sentiment.overallScore}%
              </span>
              <div className="w-14 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${sentiment.overallScore}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentStyle.desc}
          </p>
        </div>

        {/* Right: Wall Street / Indian Consensus Price Target Box */}
        <div className="bg-slate-950/85 border border-slate-800/90 rounded-xl p-4 sm:p-5 flex-1 max-w-md shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Consensus Price Target (12-Mo)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {pt.totalRatingsCount} {isIndian ? 'Institutional Analysts' : 'Wall St Analysts'}
            </span>
          </div>

          {/* Median Target & Upside Callout */}
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="text-[11px] text-slate-400">Median Target ({curr})</div>
              <div className="text-2xl font-black text-white font-mono">
                {curr}{pt.median.toFixed(2)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-400">Implied Upside</div>
              <div
                className={`text-lg font-extrabold font-mono flex items-center justify-end gap-0.5 ${
                  medianUpside >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{medianUpside >= 0 ? '+' : ''}{medianUpside}%</span>
              </div>
            </div>
          </div>

          {/* Target Slider Line */}
          <div className="space-y-1 pt-1">
            <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-visible">
              {/* Range fill */}
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-blue-900/40 rounded-full" />
              
              {/* Current Price Pin */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow-md z-10"
                style={{ left: `${currentPosInTarget}%` }}
                title={`Current Price: ${curr}${quote.price}`}
              />

              {/* Median Target Pin */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-400 rounded-full z-10"
                style={{ left: `${medianPosInTarget}%` }}
                title={`Median Target: ${curr}${pt.median}`}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span>Low: {curr}{pt.low.toFixed(2)}</span>
              <span className="text-blue-300 font-semibold">Current: {curr}{quote.price.toFixed(2)}</span>
              <span>High: {curr}{pt.high.toFixed(2)} (+{highUpside}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Multi-Source Pillar Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
        {/* 1. Expert Analyst Ratings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              {isIndian ? 'Institutional Brokers' : 'Wall St Experts'}
            </span>
            <span className="font-mono text-emerald-400 font-bold">{sentiment.expertAnalystScore}%</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            <span className="text-emerald-400 font-bold">{pt.distribution.strongBuy + pt.distribution.buy} Bullish</span> vs{' '}
            <span className="text-rose-400 font-bold">{pt.distribution.sell + pt.distribution.strongSell} Bearish</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${sentiment.expertAnalystScore}%` }} />
          </div>
        </div>

        {/* 2. Live News & Media Sentiment */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              News Sentiment
            </span>
            <span className="font-mono text-amber-400 font-bold">{sentiment.newsMediaScore}%</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {sentiment.newsMediaScore >= 70 ? 'Strong Positive Coverage' : sentiment.newsMediaScore >= 45 ? 'Balanced News Flow' : 'Cautious Headwinds'}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${sentiment.newsMediaScore}%` }} />
          </div>
        </div>

        {/* 3. Technical Momentum */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Technical Setup
            </span>
            <span className="font-mono text-emerald-400 font-bold">{sentiment.technicalScore}%</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {sentiment.technicalScore >= 75 ? 'Strong Bullish Structure' : 'Healthy Consolidation'}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sentiment.technicalScore}%` }} />
          </div>
        </div>

        {/* 4. Fundamental Health & Valuation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Fundamentals
            </span>
            <span className="font-mono text-purple-400 font-bold">{sentiment.fundamentalScore}%</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Robust Free Cash Flow & Margins
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${sentiment.fundamentalScore}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
