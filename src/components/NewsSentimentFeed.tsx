import React, { useState } from 'react';
import { NewsItem } from '../types/stock';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Flame,
  Clock,
  Filter,
} from 'lucide-react';

interface NewsSentimentFeedProps {
  news: NewsItem[];
  ticker: string;
}

export const NewsSentimentFeed: React.FC<NewsSentimentFeedProps> = ({ news, ticker }) => {
  const [filter, setFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL');

  const filteredNews = filter === 'ALL'
    ? news
    : news.filter((item) => item.sentiment === filter);

  // Compute sentiment breakdown
  const bullishCount = news.filter((n) => n.sentiment === 'BULLISH').length;
  const bearishCount = news.filter((n) => n.sentiment === 'BEARISH').length;
  const neutralCount = news.filter((n) => n.sentiment === 'NEUTRAL').length;

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return {
          icon: <TrendingUp className="w-3 h-3 text-emerald-400" />,
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: 'Bullish Catalyst',
        };
      case 'BEARISH':
        return {
          icon: <TrendingDown className="w-3 h-3 text-rose-400" />,
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          label: 'Bearish Headwind',
        };
      case 'NEUTRAL':
      default:
        return {
          icon: <Minus className="w-3 h-3 text-blue-400" />,
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          label: 'Neutral / Informational',
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Real-Time Breaking News & Sentiment
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional news feed with AI sentiment classification and catalyst weighting
          </p>
        </div>

        {/* Sentiment Mini Summary */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-emerald-400 font-semibold">{bullishCount} Bullish</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{neutralCount} Neutral</span>
          <span className="text-slate-600">•</span>
          <span className="text-rose-400 font-semibold">{bearishCount} Bearish</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
        {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              filter === mode
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {mode === 'ALL' ? 'All Headlines' : mode}
          </button>
        ))}
      </div>

      {/* News Stream Cards */}
      <div className="space-y-3">
        {filteredNews.map((item) => {
          const badge = getSentimentBadge(item.sentiment);
          return (
            <div
              key={item.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1.5 ${badge.bg}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>

                  {item.impactWeight === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      <span>High Impact</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">{item.publisher}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{item.publishedAt}</span>
                  </div>
                </div>
              </div>

              {/* Title & Summary */}
              <div>
                <h4 className="text-sm font-bold text-white leading-snug hover:text-blue-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {item.summary}
                </p>
              </div>

              {/* Link if available */}
              {item.url && (
                <div className="pt-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                  >
                    <span>Read verified source coverage</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
