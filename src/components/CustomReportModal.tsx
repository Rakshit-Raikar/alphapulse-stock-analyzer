import React, { useState } from 'react';
import { X, Sparkles, FileText, Upload, CheckCircle2 } from 'lucide-react';

interface CustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  onSubmit: (reportText: string) => void;
  isAnalyzing: boolean;
}

export const CustomReportModal: React.FC<CustomReportModalProps> = ({
  isOpen,
  onClose,
  ticker,
  onSubmit,
  isAnalyzing,
}) => {
  const [reportContent, setReportContent] = useState('');
  const [sourceName, setSourceName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportContent.trim()) {
      const formatted = sourceName.trim()
        ? `[Source: ${sourceName.trim()}]\n${reportContent.trim()}`
        : reportContent.trim();
      onSubmit(formatted);
      onClose();
    }
  };

  const loadSampleReport = () => {
    const isIndian = ticker.includes('.NS') || ticker.includes('.BO');
    if (isIndian) {
      setSourceName('Motilal Oswal Financial Services');
      setReportContent(
        `Motilal Oswal reiterates Strong Buy on ${ticker.replace('.NS', '').replace('.BO', '')}. We raise our 12-month target to ₹3,450 based on expanding domestic market share, strong operating leverage, and robust DII inflow support. ROCE remains superior to sector peers with defensive balance sheet stability.`
      );
    } else {
      setSourceName('Morgan Stanley Equity Research');
      setReportContent(
        `Morgan Stanley maintains Overweight rating on ${ticker}. We raise our price target to $185 from $160 based on robust hyperscaler capex commitment, expanding enterprise margins, and software monetization moat.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400 border border-blue-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Incorporate Expert Financial Report
              </h3>
              <p className="text-xs text-slate-400">
                Feed external broker reports, earnings transcripts, or private notes for {ticker}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Report Source / Author / Institution (Optional)
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. Goldman Sachs, Wedbush, Morningstar, CFO Memo..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Financial Report Content / Analyst Thesis Excerpt
              </label>
              <button
                type="button"
                onClick={loadSampleReport}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline"
              >
                Insert Sample Morgan Stanley Note
              </button>
            </div>

            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              rows={6}
              required
              placeholder={`Paste the text of any expert analysis, research memorandum, or broker upgrade for ${ticker}...`}
              className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-xs leading-relaxed focus:outline-hidden focus:border-blue-500 font-mono"
            />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              The AI will parse your custom financial report, cross-reference it against live market news and technicals, and adjust the Buy/Sell conviction score accordingly.
            </span>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isAnalyzing || !reportContent.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAnalyzing ? 'Synthesizing...' : 'Re-Run Multi-Source Synthesis'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
