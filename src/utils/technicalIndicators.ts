import { CandleData } from '../types/stock';

// Calculate Exponential Moving Average (EMA)
export function calculateEMA(data: CandleData[], period: number): (number | null)[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaValues: (number | null)[] = [];

  // Need at least 'period' items
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sum += data[i].close;
      emaValues.push(null);
    } else if (i === period - 1) {
      sum += data[i].close;
      const initialSMA = sum / period;
      emaValues.push(Number(initialSMA.toFixed(2)));
    } else {
      const prevEMA = emaValues[i - 1]!;
      const currentEMA = data[i].close * k + prevEMA * (1 - k);
      emaValues.push(Number(currentEMA.toFixed(2)));
    }
  }

  return emaValues;
}

// Calculate Relative Strength Index (RSI)
export function calculateRSI(data: CandleData[], period: number = 14): (number | null)[] {
  if (data.length <= period) {
    return data.map(() => null);
  }

  const rsiValues: (number | null)[] = [null];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  // First average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 1; i < period; i++) {
    rsiValues.push(null);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  rsiValues.push(Number(rsi.toFixed(1)));

  // Smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    rsiValues.push(Number(rsi.toFixed(1)));
  }

  return rsiValues;
}

// Calculate MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  data: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(Number((fastEMA[i]! - slowEMA[i]!).toFixed(2)));
    } else {
      macdLine.push(null);
    }
  }

  // Calculate Signal line (EMA of MACD line)
  const validMacd = macdLine.map(v => (v === null ? 0 : v));
  const k = 2 / (signalPeriod + 1);
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  let sum = 0;
  let validCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
      continue;
    }

    validCount++;
    if (validCount < signalPeriod) {
      sum += macdLine[i]!;
      signalLine.push(null);
      histogram.push(null);
    } else if (validCount === signalPeriod) {
      sum += macdLine[i]!;
      const initial = sum / signalPeriod;
      signalLine.push(Number(initial.toFixed(2)));
      histogram.push(Number((macdLine[i]! - initial).toFixed(2)));
    } else {
      const prevSig = signalLine[i - 1] ?? 0;
      const curSig = macdLine[i]! * k + prevSig * (1 - k);
      signalLine.push(Number(curSig.toFixed(2)));
      histogram.push(Number((macdLine[i]! - curSig).toFixed(2)));
    }
  }

  return { macdLine, signalLine, histogram };
}
