import React, { useState } from 'react';
import { AnalystRating, MultiSourceSentiment } from '../types/stock';
import {
  Award,
  Building,
  TrendingUp,
  FileText,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
} from 'lucide-react';

interface ExpertReportsPanelProps {
  ratings: AnalystRating[];
  sentiment: MultiSourceSentiment;
  ticker: string;
  onAddCustomReport: (reportText: string) => void;
  isAnalyzing: boolean;
  currencySymbol?: string;
}

export const ExpertReportsPanel: React.FC<ExpertReportsPanelProps> = ({
  ratings,
  sentiment,
  ticker,
  onAddCustomReport,
  isAnalyzing,
  currencySymbol = '$',
}) => {
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [customText, setCustomText] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const pt = sentiment.consensusPriceTarget;
  const dist = pt.distribution;
  const total = pt.totalRatingsCount || 1;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim()) {
      onAddCustomReport(customText.trim());
      setIsInputExpanded(false);
    }
  };

  const getBadgeStyle = (action: string) => {
    switch (action.toLowerCase()) {
      case 'strong buy':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'buy':
      case 'outperform':
      case 'overweight':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'hold':
      case 'neutral':
      case 'market perform':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'underperform':
      case 'underweight':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'sell':
      case 'strong sell':
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  const filteredRatings = filterAction === 'ALL'
    ? ratings
    : ratings.filter((r) => r.action.toLowerCase().includes(filterAction.toLowerCase()));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">
              Wall Street & Expert Financial Reports
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional consensus, target revisions, and broker research notes
          </p>
        </div>

        {/* Custom Input Button */}
        <button
          onClick={() => setIsInputExpanded(!isInputExpanded)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>{isInputExpanded ? 'Close Custom Input' : 'Incorporate Custom Report'}</span>
          {isInputExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Custom Report Input Drawer */}
      {isInputExpanded && (
        <form
          onSubmit={handleCustomSubmit}
          className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <FileText className="w-4 h-4" />
              <span>Paste Expert Report, Broker Note, or Earnings Excerpt</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Weights into AI Multi-Source Synthesis
            </span>
          </div>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={4}
            placeholder={`Example: "Goldman Sachs reiterated Conviction Buy on ${ticker} with a $180 target, citing 35% data center TAM acceleration and higher operating leverage into FY27..."`}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-xs leading-relaxed focus:outline-hidden focus:border-blue-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {customText.length} characters entered
            </span>
            <button
              type="submit"
              disabled={isAnalyzing || !customText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAnalyzing ? 'Re-analyzing...' : 'Synthesize With This Report'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Consensus Rating Distribution Bar */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-slate-300 flex items-center gap-2">
            <span>Wall Street Consensus Distribution</span>
            <span className="text-slate-500">({total} Analysts Tracked)</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-400">Strong Buy: {dist.strongBuy}</span>
            <span className="text-teal-400">Buy: {dist.buy}</span>
            <span className="text-amber-400">Hold: {dist.hold}</span>
            <span className="text-rose-400">Sell: {dist.sell + dist.strongSell}</span>
          </div>
        </div>

        {/* Multi-colored Distribution Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full flex overflow-hidden">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${(dist.strongBuy / total) * 100}%` }}
            title={`Strong Buy: ${dist.strongBuy}`}
          />
          <div
            className="bg-teal-500 h-full"
            style={{ width: `${(dist.buy / total) * 100}%` }}
            title={`Buy: ${dist.buy}`}
          />
          <div
            className="bg-amber-500 h-full"
            style={{ width: `${(dist.hold / total) * 100}%` }}
            title={`Hold: ${dist.hold}`}
          />
          <div
            className="bg-rose-500 h-full"
            style={{ width: `${((dist.sell + dist.strongSell) / total) * 100}%` }}
            title={`Sell: ${dist.sell + dist.strongSell}`}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Filter by Rating:</span>
        {['ALL', 'Strong Buy', 'Buy', 'Hold'].map((action) => (
          <button
            key={action}
            onClick={() => setFilterAction(action)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filterAction === action
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Individual Expert Reports Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRatings.map((rating, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {rating.firm}
                    </div>
                    {rating.analyst && (
                      <div className="text-[11px] text-slate-500">{rating.analyst}</div>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getBadgeStyle(
                    rating.action
                  )}`}
                >
                  {rating.action}
                </span>
              </div>

              {/* Rationale / Summary */}
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                "{rating.summary}"
              </p>
            </div>

            {/* Price Target & Metadata Footer */}
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
              <div className="font-mono">
                <span className="text-slate-400 text-[11px]">Target: </span>
                <span className="font-bold text-white">{currencySymbol}{rating.targetPrice.toFixed(2)}</span>
                {rating.priorTargetPrice && (
                  <span className="text-slate-500 text-[10px] ml-1">
                    (Prior: {currencySymbol}{rating.priorTargetPrice.toFixed(2)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[10px]">{rating.date}</span>
                {rating.sourceUrl && (
                  <a
                    href={rating.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                    title="View Source"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
