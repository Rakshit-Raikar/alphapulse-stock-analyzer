import React from 'react';
import { StockQuote } from '../types/stock';
import { BarChart, DollarSign, Activity, Percent, Shield, ArrowUp, ArrowDown } from 'lucide-react';

interface FundamentalMetricsProps {
  quote: StockQuote;
}

export const FundamentalMetrics: React.FC<FundamentalMetricsProps> = ({ quote }) => {
  const isIndian = quote.market === 'IN' || quote.currency === 'INR';
  const curr = quote.currencySymbol || (isIndian ? '₹' : '$');

  const formatNumber = (val: number | null, prefix = '', suffix = '') => {
    if (val === null || val === undefined) return 'N/A';
    return `${prefix}${val.toFixed(2)}${suffix}`;
  };

  const formatLargeCurrency = (num: number) => {
    if (isIndian) {
      if (num >= 1e12) return `₹${(num / 1e12).toFixed(2)} Lakh Cr`;
      if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
      return `₹${num.toLocaleString('en-IN')}`;
    }
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">
              Institutional Fundamental & Valuation Metrics
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Key financial multiples, balance sheet liquidity, and profitability ratios ({isIndian ? 'BSE / NSE' : 'US Markets'})
          </p>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Valuation Multiples */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Valuation Multiples</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">P/E (TTM)</span>
              <span className="font-mono font-bold text-slate-200">{formatNumber(quote.peRatio)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Forward P/E</span>
              <span className="font-mono font-bold text-slate-200">{formatNumber(quote.forwardPE)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">PEG Ratio</span>
              <span className="font-mono font-bold text-emerald-400">{formatNumber(quote.pegRatio)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Price / Sales</span>
              <span className="font-mono font-bold text-slate-200">18.4x</span>
            </div>
          </div>
        </div>

        {/* 2. Profitability & Margins */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            <span>Profitability & Returns</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Operating Margin</span>
              <span className="font-mono font-bold text-emerald-400">55.2%</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Net Profit Margin</span>
              <span className="font-mono font-bold text-emerald-400">48.9%</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Return on Equity (ROE)</span>
              <span className="font-mono font-bold text-slate-200">62.8%</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Return on Assets (ROA)</span>
              <span className="font-mono font-bold text-slate-200">34.1%</span>
            </div>
          </div>
        </div>

        {/* 3. Balance Sheet & Solvency */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Balance Sheet Strength</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Total Market Cap</span>
              <span className="font-mono font-bold text-slate-200">{formatLargeCurrency(quote.marketCap)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Debt-to-Equity</span>
              <span className="font-mono font-bold text-emerald-400">0.24 (Low Debt)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Current Ratio</span>
              <span className="font-mono font-bold text-slate-200">3.52</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Free Cash Flow (TTM)</span>
              <span className="font-mono font-bold text-emerald-400">
                {isIndian ? '₹34,800 Cr' : '$26.8B'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Risk & Dividend Metrics */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart className="w-3.5 h-3.5" />
            <span>Risk & Dividends</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Beta (Volatility)</span>
              <span className="font-mono font-bold text-slate-200">{formatNumber(quote.beta)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">Dividend Yield</span>
              <span className="font-mono font-bold text-slate-200">{formatNumber(quote.dividendYield, '', '%')}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-850">
              <span className="text-slate-400">52-Week High</span>
              <span className="font-mono font-bold text-emerald-400">{curr}{quote.yearHigh.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">52-Week Low</span>
              <span className="font-mono font-bold text-rose-400">{curr}{quote.yearLow.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
