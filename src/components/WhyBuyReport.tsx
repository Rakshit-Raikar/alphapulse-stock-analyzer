import React from 'react';
import { ComprehensiveReport, StockQuote } from '../types/stock';
import {
  CheckCircle,
  AlertOctagon,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  FileCheck2,
  ExternalLink,
  Clock,
  Briefcase,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface WhyBuyReportProps {
  report: ComprehensiveReport;
  quote: StockQuote;
}

export const WhyBuyReport: React.FC<WhyBuyReportProps> = ({ report, quote }) => {
  const isBuyAction =
    report.finalDecision.action === 'STRONG_BUY' || report.finalDecision.action === 'BUY';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-7">
      {/* Header section with Report Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5" />
              Institutional Investment Memo
            </span>
            <span className="text-slate-500 text-xs">
              Updated {new Date(report.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Final Report: Why Buy {report.ticker} ({report.companyName})?
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {report.executiveSummary}
          </p>
        </div>

        {/* Action Strategy Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 min-w-[260px] flex flex-col justify-between">
          <div className="text-xs text-slate-400 mb-1">Target Investment Horizon</div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{report.finalDecision.targetHorizon}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Recommended Allocation:</div>
          <div className="text-xs font-semibold text-emerald-400">
            {report.finalDecision.recommendedAllocation}
          </div>
        </div>
      </div>

      {/* 1. Core Bull Thesis: Why You Should Buy */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              The Bull Case: {report.whyBuyThesis.headline}
            </h3>
            <span className="text-xs text-slate-400">
              Primary catalyst drivers supporting equity upside
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {report.whyBuyThesis.keyPoints.map((point, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                {point}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Moat & Financial Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Competitive Moat */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Competitive Moat & Market Dominance</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.whyBuyThesis.competitiveMoat}
          </p>
        </div>

        {/* Financial Health Review */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Balance Sheet & Free Cash Flow Quality</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.whyBuyThesis.financialHealthReview}
          </p>
        </div>
      </div>

      {/* 3. Valuation Verdict & Intrinsic Fair Value */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valuation Multiples Assessment
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-extrabold rounded-md ${
                report.valuationVerdict.assessment === 'Undervalued'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : report.valuationVerdict.assessment === 'Fair Value'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {report.valuationVerdict.assessment}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.valuationVerdict.reasoning}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 text-right min-w-[200px]">
          <div className="text-[11px] text-slate-400 font-medium">Estimated Fair Value</div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {quote.currencySymbol || (quote.market === 'IN' ? '₹' : '$')}{report.valuationVerdict.fairValueEstimate.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Current Price: <span className="text-white font-mono font-semibold">{quote.currencySymbol || (quote.market === 'IN' ? '₹' : '$')}{quote.price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 4. Bear Case & Downside Risk Protection */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Bear Case & Risks: {report.risksAndBearCase.headline}
            </h3>
            <span className="text-xs text-slate-400">
              Counter-arguments and conditions that could invalidate the bull thesis
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {report.risksAndBearCase.keyRisks.map((risk, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-rose-950/40 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>{risk}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-400 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <span>Critical Downside Support / Margin of Safety:</span>
          <span className="text-slate-200 font-mono font-bold">
            {report.risksAndBearCase.downsideSupportLevel}
          </span>
        </div>
      </div>

      {/* 5. Upcoming Catalysts Timeline */}
      {report.catalystsTimeline && report.catalystsTimeline.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Upcoming Market Catalysts</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {report.catalystsTimeline.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.event}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    {item.potentialImpact}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{item.expectedTiming}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Technical Analysis Summary */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Technical Chart Structure Verdict</span>
          </div>
          <span className="text-xs font-semibold text-emerald-400 font-mono">
            {report.technicalAnalysisSummary.trend}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {report.technicalAnalysisSummary.movingAveragesVerdict}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-400">
          <span>Key Support: <strong className="text-slate-200">{quote.currencySymbol || (quote.market === 'IN' ? '₹' : '$')}{report.technicalAnalysisSummary.keySupport.toFixed(2)}</strong></span>
          <span>Key Resistance: <strong className="text-slate-200">{quote.currencySymbol || (quote.market === 'IN' ? '₹' : '$')}{report.technicalAnalysisSummary.keyResistance.toFixed(2)}</strong></span>
          <span>RSI Momentum: <strong className="text-slate-200">{report.technicalAnalysisSummary.rsiStatus}</strong></span>
        </div>
      </div>

      {/* 7. Bottom Decision Banner */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Bottom Line Verdict
          </div>
          <div className="text-sm sm:text-base font-semibold text-white mt-0.5">
            "{report.finalDecision.summaryOneLiner}"
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20">
            <span>Conviction {report.finalDecision.convictionPercent}%</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 8. Verified Live Grounding Citations */}
      {report.groundingSources && report.groundingSources.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 text-slate-500" />
            <span>Verified Grounding Research Citations (Google Search Live Grounding):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.groundingSources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-blue-300 border border-slate-800 hover:border-blue-500/40 rounded-lg flex items-center gap-1.5 transition-colors max-w-xs truncate"
                title={source.title}
              >
                <span className="truncate">{source.title}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
