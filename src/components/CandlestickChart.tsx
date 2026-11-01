import React, { useRef, useEffect, useState, useMemo } from 'react';
import { CandleData } from '../types/stock';
import { calculateEMA, calculateRSI, calculateMACD } from '../utils/technicalIndicators';
import { TrendingUp, BarChart2, Eye, Activity, Maximize2, Minimize2 } from 'lucide-react';

interface CandlestickChartProps {
  candles: CandleData[];
  ticker: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  isLoading?: boolean;
  currencySymbol?: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  ticker,
  timeframe,
  onTimeframeChange,
  isLoading = false,
  currencySymbol = '$',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // User indicator toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [secondaryIndicator, setSecondaryIndicator] = useState<'NONE' | 'RSI' | 'MACD'>('RSI');
  const [chartMode, setChartMode] = useState<'CANDLE' | 'LINE'>('CANDLE');
  const [isExpanded, setIsExpanded] = useState(false);

  // Interactive Hover State
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Calculate technical indicators
  const ema20 = useMemo(() => calculateEMA(candles, 20), [candles]);
  const ema50 = useMemo(() => calculateEMA(candles, 50), [candles]);
  const ema200 = useMemo(() => calculateEMA(candles, 200), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);
  const macd = useMemo(() => calculateMACD(candles, 12, 26, 9), [candles]);

  // Active displayed candle (hovered or latest)
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex]
    ? candles[hoveredIndex]
    : candles[candles.length - 1];

  const activeEma20 = hoveredIndex !== null ? ema20[hoveredIndex] : ema20[ema20.length - 1];
  const activeEma50 = hoveredIndex !== null ? ema50[hoveredIndex] : ema50[ema50.length - 1];
  const activeRsi = hoveredIndex !== null ? rsi[hoveredIndex] : rsi[rsi.length - 1];

  const candleChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleChangePercent = activeCandle && activeCandle.open ? (candleChange / activeCandle.open) * 100 : 0;
  const isUp = candleChange >= 0;

  // Render to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = isExpanded ? 580 : 420;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Layout partitions
    const paddingRight = 65; // Price scale width
    const paddingBottom = 26; // Date scale height
    const paddingTop = 15;
    const paddingLeft = 10;

    const availableWidth = width - paddingRight - paddingLeft;
    
    // Sub-pane heights
    const hasSecondary = secondaryIndicator !== 'NONE';
    const secondaryHeight = hasSecondary ? 90 : 0;
    const volumeHeight = showVolume ? (hasSecondary ? 45 : 65) : 0;
    const mainChartHeight = height - paddingBottom - paddingTop - secondaryHeight - volumeHeight - 10;

    // Price range calculation
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;

      if (showEMA20 && ema20[i] !== null) {
        if (ema20[i]! < minPrice) minPrice = ema20[i]!;
        if (ema20[i]! > maxPrice) maxPrice = ema20[i]!;
      }
      if (showEMA50 && ema50[i] !== null) {
        if (ema50[i]! < minPrice) minPrice = ema50[i]!;
        if (ema50[i]! > maxPrice) maxPrice = ema50[i]!;
      }
      if (showEMA200 && ema200[i] !== null) {
        if (ema200[i]! < minPrice) minPrice = ema200[i]!;
        if (ema200[i]! > maxPrice) maxPrice = ema200[i]!;
      }
    }

    // Add 4% padding to price range
    const priceBuffer = (maxPrice - minPrice) * 0.04 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice;

    // Coordinate mapping functions
    const getX = (index: number) => {
      const step = availableWidth / Math.max(candles.length, 1);
      return paddingLeft + index * step + step / 2;
    };

    const getY = (price: number) => {
      return paddingTop + mainChartHeight - ((price - minPrice) / priceRange) * mainChartHeight;
    };

    // 1. Draw Grid Lines (Horizontal price lines)
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const numHorizontalLines = 5;
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= numHorizontalLines; i++) {
      const priceVal = minPrice + (priceRange / numHorizontalLines) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Right axis price label
      ctx.fillText(`${currencySymbol}${priceVal.toFixed(2)}`, width - paddingRight + 6, y + 3);
    }

    // 2. Vertical Grid & Date labels
    const stepX = Math.max(1, Math.floor(candles.length / 6));
    ctx.textAlign = 'center';
    for (let i = 0; i < candles.length; i += stepX) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      // Date label
      ctx.fillText(candles[i].time, x, height - 8);
    }
    ctx.setLineDash([]); // Reset line dash

    // 3. Draw Volume Sub-chart if enabled
    if (showVolume) {
      const volTop = paddingTop + mainChartHeight + 8;
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const x = getX(i);
        const candleWidth = Math.max(2, (availableWidth / candles.length) * 0.7);
        const barHeight = maxVolume > 0 ? (c.volume / maxVolume) * volumeHeight : 0;
        const y = volTop + volumeHeight - barHeight;

        ctx.fillStyle = c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';
        ctx.fillRect(x - candleWidth / 2, y, candleWidth, barHeight);
      }
    }

    // 4. Draw Secondary Indicator (RSI or MACD)
    if (secondaryIndicator === 'RSI') {
      const rsiTop = height - paddingBottom - secondaryHeight;
      // RSI Bounds (70 overbought, 30 oversold, 50 neutral)
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, rsiTop);
      ctx.lineTo(width - paddingRight, rsiTop);
      ctx.stroke();

      // 70 Line
      const y70 = rsiTop + secondaryHeight * 0.3;
      const y30 = rsiTop + secondaryHeight * 0.7;
      const y50 = rsiTop + secondaryHeight * 0.5;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fillRect(paddingLeft, rsiTop, availableWidth, secondaryHeight * 0.3);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(paddingLeft, y30, availableWidth, secondaryHeight * 0.3);

      ctx.strokeStyle = '#475569';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y70);
      ctx.lineTo(width - paddingRight, y70);
      ctx.moveTo(paddingLeft, y50);
      ctx.lineTo(width - paddingRight, y50);
      ctx.moveTo(paddingLeft, y30);
      ctx.lineTo(width - paddingRight, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('RSI (14)', paddingLeft + 4, rsiTop + 12);
      ctx.fillText('70', width - paddingRight + 6, y70 + 3);
      ctx.fillText('30', width - paddingRight + 6, y30 + 3);

      // Plot RSI Line
      ctx.strokeStyle = '#a855f7'; // purple-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < candles.length; i++) {
        const val = rsi[i];
        if (val !== null) {
          const x = getX(i);
          const y = rsiTop + secondaryHeight - (val / 100) * secondaryHeight;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    } else if (secondaryIndicator === 'MACD') {
      const macdTop = height - paddingBottom - secondaryHeight;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, macdTop);
      ctx.lineTo(width - paddingRight, macdTop);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('MACD (12, 26, 9)', paddingLeft + 4, macdTop + 12);

      // Find MACD bounds
      let maxM = 0.1;
      for (let i = 0; i < candles.length; i++) {
        if (macd.macdLine[i] !== null) maxM = Math.max(maxM, Math.abs(macd.macdLine[i]!));
        if (macd.signalLine[i] !== null) maxM = Math.max(maxM, Math.abs(macd.signalLine[i]!));
      }
      const zeroY = macdTop + secondaryHeight / 2;

      // Histogram
      for (let i = 0; i < candles.length; i++) {
        const hist = macd.histogram[i];
        if (hist !== null) {
          const x = getX(i);
          const h = (hist / maxM) * (secondaryHeight / 2);
          ctx.fillStyle = hist >= 0 ? '#10b981' : '#f43f5e';
          ctx.fillRect(x - 1.5, zeroY - (h > 0 ? h : 0), 3, Math.abs(h));
        }
      }

      // MACD Line
      ctx.strokeStyle = '#38bdf8'; // blue
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let mStarted = false;
      for (let i = 0; i < candles.length; i++) {
        const val = macd.macdLine[i];
        if (val !== null) {
          const x = getX(i);
          const y = zeroY - (val / maxM) * (secondaryHeight / 2);
          if (!mStarted) {
            ctx.moveTo(x, y);
            mStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Signal Line
      ctx.strokeStyle = '#f59e0b'; // amber
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let sStarted = false;
      for (let i = 0; i < candles.length; i++) {
        const val = macd.signalLine[i];
        if (val !== null) {
          const x = getX(i);
          const y = zeroY - (val / maxM) * (secondaryHeight / 2);
          if (!sStarted) {
            ctx.moveTo(x, y);
            sStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 5. Draw Candlesticks or Smooth Line
    const candleWidth = Math.max(2, (availableWidth / candles.length) * 0.7);

    if (chartMode === 'CANDLE') {
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const x = getX(i);
        const yOpen = getY(c.open);
        const yClose = getY(c.close);
        const yHigh = getY(c.high);
        const yLow = getY(c.low);
        const isBullish = c.close >= c.open;

        const color = isBullish ? '#10b981' : '#f43f5e'; // Emerald-500 / Rose-500

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    } else {
      // Line mode with gradient fill
      const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + mainChartHeight);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.lineTo(getX(candles.length - 1), paddingTop + mainChartHeight);
      ctx.lineTo(getX(0), paddingTop + mainChartHeight);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 6. Draw Moving Average Overlays
    const drawOverlayLine = (values: (number | null)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let hasStarted = false;
      for (let i = 0; i < candles.length; i++) {
        const val = values[i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (showEMA20) drawOverlayLine(ema20, '#f59e0b'); // amber-500
    if (showEMA50) drawOverlayLine(ema50, '#38bdf8'); // sky-400
    if (showEMA200) drawOverlayLine(ema200, '#c084fc'); // purple-400

    // 7. Interactive Crosshair & Tooltip Overlay
    if (hoveredIndex !== null && mousePos) {
      const crossX = getX(hoveredIndex);
      const crossY = mousePos.y;

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crossX, paddingTop);
      ctx.lineTo(crossX, height - paddingBottom);
      ctx.stroke();

      // Horizontal line (only within main chart)
      if (crossY >= paddingTop && crossY <= paddingTop + mainChartHeight) {
        ctx.beginPath();
        ctx.moveTo(paddingLeft, crossY);
        ctx.lineTo(width - paddingRight, crossY);
        ctx.stroke();

        // Calculate and draw price pill on Y axis
        const hoverPrice = maxPrice - ((crossY - paddingTop) / mainChartHeight) * priceRange;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(width - paddingRight + 2, crossY - 9, 60, 18);
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([]);
        ctx.strokeRect(width - paddingRight + 2, crossY - 9, 60, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`${currencySymbol}${hoverPrice.toFixed(2)}`, width - paddingRight + 6, crossY + 4);
      }
      ctx.setLineDash([]);
    }
  }, [
    candles,
    timeframe,
    showEMA20,
    showEMA50,
    showEMA200,
    showVolume,
    secondaryIndicator,
    chartMode,
    isExpanded,
    hoveredIndex,
    mousePos,
    ema20,
    ema50,
    ema200,
    rsi,
    macd,
  ]);

  // Handle Mouse Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const paddingLeft = 10;
    const paddingRight = 65;
    const availableWidth = rect.width - paddingRight - paddingLeft;
    const step = availableWidth / Math.max(candles.length, 1);

    const index = Math.floor((x - paddingLeft) / step);
    if (index >= 0 && index < candles.length) {
      setHoveredIndex(index);
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePos(null);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200 shadow-xl ${
        isExpanded ? 'fixed inset-4 z-50 bg-slate-950 flex flex-col' : 'relative'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm">
        {/* Timeframes */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {['1D', '5D', '1M', '6M', '1Y', '5Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart View Mode & Indicator Switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Candle vs Line */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setChartMode('CANDLE')}
              className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                chartMode === 'CANDLE' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
            <button
              onClick={() => setChartMode('LINE')}
              className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                chartMode === 'LINE' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
          </div>

          {/* Indicator toggles */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <label className="flex items-center gap-1 cursor-pointer text-amber-400 hover:opacity-90">
              <input
                type="checkbox"
                checked={showEMA20}
                onChange={(e) => setShowEMA20(e.target.checked)}
                className="w-3 h-3 accent-amber-500 rounded"
              />
              <span>EMA 20</span>
            </label>
            <span className="text-slate-700">|</span>
            <label className="flex items-center gap-1 cursor-pointer text-sky-400 hover:opacity-90">
              <input
                type="checkbox"
                checked={showEMA50}
                onChange={(e) => setShowEMA50(e.target.checked)}
                className="w-3 h-3 accent-sky-500 rounded"
              />
              <span>EMA 50</span>
            </label>
            <span className="text-slate-700">|</span>
            <label className="flex items-center gap-1 cursor-pointer text-purple-400 hover:opacity-90">
              <input
                type="checkbox"
                checked={showEMA200}
                onChange={(e) => setShowEMA200(e.target.checked)}
                className="w-3 h-3 accent-purple-500 rounded"
              />
              <span>EMA 200</span>
            </label>
          </div>

          {/* Sub-panel selector */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            <span className="px-2 text-slate-500 text-[11px] font-medium">Oscillator:</span>
            {(['NONE', 'RSI', 'MACD'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSecondaryIndicator(mode)}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  secondaryIndicator === mode
                    ? 'bg-slate-800 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title={isExpanded ? 'Minimize' : 'Maximize Chart'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Floating Live OHLC Bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">{ticker}</span>
          <span className="text-slate-500 font-sans">{activeCandle?.time || '—'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            <span className="text-slate-500">O:</span>{' '}
            <span className="text-slate-200 font-semibold">{currencySymbol}{activeCandle?.open?.toFixed(2) ?? '—'}</span>
          </span>
          <span>
            <span className="text-slate-500">H:</span>{' '}
            <span className="text-emerald-400 font-semibold">{currencySymbol}{activeCandle?.high?.toFixed(2) ?? '—'}</span>
          </span>
          <span>
            <span className="text-slate-500">L:</span>{' '}
            <span className="text-rose-400 font-semibold">{currencySymbol}{activeCandle?.low?.toFixed(2) ?? '—'}</span>
          </span>
          <span>
            <span className="text-slate-500">C:</span>{' '}
            <span
              className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {currencySymbol}{activeCandle?.close?.toFixed(2) ?? '—'}
            </span>
          </span>
          <span>
            <span className="text-slate-500">Chg:</span>{' '}
            <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
              {candleChange >= 0 ? '+' : ''}{currencySymbol}{candleChange.toFixed(2)} ({candleChangePercent >= 0 ? '+' : ''}
              {candleChangePercent.toFixed(2)}%)
            </span>
          </span>
          <span className="hidden md:inline">
            <span className="text-slate-500">Vol:</span>{' '}
            <span className="text-slate-300">
              {activeCandle?.volume ? (activeCandle.volume / 1000000).toFixed(2) + 'M' : '—'}
            </span>
          </span>
        </div>

        {/* Dynamic Indicator Values */}
        <div className="ml-auto hidden lg:flex items-center gap-3 text-[11px]">
          {showEMA20 && activeEma20 !== null && (
            <span className="text-amber-400">EMA20: {currencySymbol}{activeEma20.toFixed(2)}</span>
          )}
          {showEMA50 && activeEma50 !== null && (
            <span className="text-sky-400">EMA50: {currencySymbol}{activeEma50.toFixed(2)}</span>
          )}
          {secondaryIndicator === 'RSI' && activeRsi !== null && (
            <span className="text-purple-400">RSI(14): {activeRsi}</span>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 bg-slate-950/40 cursor-crosshair">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm">
              <Activity className="w-4 h-4 text-blue-400 animate-spin" />
              <span>Fetching live market candles...</span>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="block w-full"
        />
      </div>

      {/* Candlestick Legend footer */}
      <div className="px-4 py-1.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span>
            <span>Bullish Candle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></span>
            <span>Bearish Candle</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span>Crosshair active</span>
          <span>•</span>
          <span>OHLCV Real-Time Feeds</span>
        </div>
      </div>
    </div>
  );
};
