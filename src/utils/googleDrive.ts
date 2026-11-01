import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { StockQuote, MultiSourceSentiment, ComprehensiveReport, AnalystRating } from '../types/stock';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth Provider with Google Drive scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory access token cache (CRITICAL: Do NOT store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Access token must be obtained via signInWithPopup
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google (MUST be called from user gesture)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Google Drive API Helpers
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * Searches for a folder by name or creates it if it does not exist
 */
export async function getOrCreateDriveFolder(
  folderName: string,
  accessToken: string
): Promise<string> {
  // Query existing folders
  const query = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(`${DRIVE_FILES_API}?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(DRIVE_FILES_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads a file (text, JSON, or Blob) to Google Drive using multipart upload
 */
export async function uploadToGoogleDrive({
  name,
  mimeType,
  content,
  folderId,
  accessToken,
}: {
  name: string;
  mimeType: string;
  content: string | Blob;
  folderId?: string;
  accessToken: string;
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name,
    mimeType,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const boundary = '-------AlphaPulseDriveBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let body: BodyInit;

  if (typeof content === 'string') {
    body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;
  } else {
    // For Blob (e.g. PDF)
    const metadataPart = new Blob(
      [
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`,
      ],
      { type: 'text/plain' }
    );
    const closePart = new Blob([closeDelimiter], { type: 'text/plain' });
    body = new Blob([metadataPart, content, closePart], {
      type: `multipart/related; boundary=${boundary}`,
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': `multipart/related; boundary=${boundary}`,
  };

  const res = await fetch(`${DRIVE_UPLOAD_API}&fields=id,name,webViewLink`, {
    method: 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${errorBody}`);
  }

  return await res.json();
}

/**
 * Saves a full App Code & Project Backup directly to Google Drive
 */
export async function saveAppBackupToDrive(accessToken: string): Promise<{
  folderId: string;
  backupFile: { id: string; name: string; webViewLink?: string };
  readmeFile: { id: string; name: string; webViewLink?: string };
}> {
  const folderId = await getOrCreateDriveFolder('AlphaPulse AI Stock Terminal', accessToken);

  // Fetch full project code bundle from backend
  const bundleRes = await fetch('/api/app/bundle');
  let bundleData: any;
  if (bundleRes.ok) {
    bundleData = await bundleRes.json();
  } else {
    bundleData = {
      appName: 'AlphaPulse AI Stock Terminal',
      exportedAt: new Date().toISOString(),
      repository: 'https://github.com/Rakshit-Raikar/alphapulse-stock-analyzer',
      note: 'Full client-side export snapshot',
    };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jsonContent = JSON.stringify(bundleData, null, 2);

  // 1. Upload Full Code & Configuration JSON
  const backupFile = await uploadToGoogleDrive({
    name: `AlphaPulse_App_Source_Backup_${timestamp}.json`,
    mimeType: 'application/json',
    content: jsonContent,
    folderId,
    accessToken,
  });

  // 2. Upload README Markdown
  const readmeText = bundleData?.files?.['README.md'] || `# AlphaPulse AI Stock Terminal\n\nBackup created at ${new Date().toLocaleString()}`;
  const readmeFile = await uploadToGoogleDrive({
    name: `AlphaPulse_Documentation_${timestamp}.md`,
    mimeType: 'text/markdown',
    content: readmeText,
    folderId,
    accessToken,
  });

  return { folderId, backupFile, readmeFile };
}

/**
 * Saves the current Stock Investment Memo & PDF to Google Drive
 */
export async function saveStockMemoToDrive({
  quote,
  report,
  sentiment,
  ratings,
  pdfBlob,
  accessToken,
}: {
  quote: StockQuote;
  report: ComprehensiveReport;
  sentiment: MultiSourceSentiment;
  ratings?: AnalystRating[];
  pdfBlob?: Blob;
  accessToken: string;
}): Promise<{
  folderId: string;
  pdfFile?: { id: string; name: string; webViewLink?: string };
  memoFile: { id: string; name: string; webViewLink?: string };
}> {
  const folderId = await getOrCreateDriveFolder('AlphaPulse AI Stock Terminal', accessToken);
  const cleanTicker = quote.ticker.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. Create formatted Research Memo Markdown
  const isIndian = quote.market === 'IN' || quote.ticker.includes('.NS');
  const curr = quote.currencySymbol || (isIndian ? '₹' : '$');
  const medianTarget = sentiment.consensusPriceTarget.median;
  const impliedUpside = sentiment.consensusPriceTarget.impliedUpsideMedianPercent;

  const memoMarkdown = `# ${quote.name} (${quote.ticker}) — Investment Research Memo
**Date:** ${new Date().toLocaleDateString()}
**Exchange:** ${quote.exchange || (isIndian ? 'NSE/BSE' : 'NASDAQ')}
**Current Price:** ${curr}${quote.price.toLocaleString()} (${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
**AI Verdict:** ${report.finalDecision.action} (Conviction: ${report.finalDecision.convictionPercent}%)
**Consensus Target:** ${curr}${medianTarget.toLocaleString()} (${impliedUpside >= 0 ? '+' : ''}${impliedUpside.toFixed(1)}%)

---

## 1. Executive Summary & Buy Thesis
${report.executiveSummary}

### Key Points
${report.whyBuyThesis.keyPoints.map((point: string, i: number) => `${i + 1}. ${point}`).join('\n')}

---

## 2. Competitive Moat & Financial Health
- **Competitive Moat:** ${report.whyBuyThesis.competitiveMoat}
- **Financial Health Review:** ${report.whyBuyThesis.financialHealthReview}

---

## 3. Risks & Bear Case
- **Headline:** ${report.risksAndBearCase.headline}
- **Downside Support Level:** ${report.risksAndBearCase.downsideSupportLevel}
- **Key Risks:**
${report.risksAndBearCase.keyRisks.map((r: string, i: number) => `  ${i + 1}. ${r}`).join('\n')}

---

## 4. Multi-Source Brokerage Consensus (Score: ${sentiment.overallScore}/100 - ${sentiment.overallVerdict})
- **Strong Buy:** ${sentiment.consensusPriceTarget.distribution.strongBuy}
- **Buy:** ${sentiment.consensusPriceTarget.distribution.buy}
- **Hold:** ${sentiment.consensusPriceTarget.distribution.hold}
- **Sell / Underperform:** ${sentiment.consensusPriceTarget.distribution.sell + sentiment.consensusPriceTarget.distribution.strongSell}

${ratings && ratings.length > 0 ? ratings.map(r => `- **${r.firm}**: ${r.action} | Target: ${curr}${r.targetPrice.toLocaleString()} (${new Date(r.date).toLocaleDateString()})`).join('\n') : ''}

---
*Generated by AlphaPulse AI Stock Terminal — Saved to Google Drive*
`;

  const memoFile = await uploadToGoogleDrive({
    name: `AlphaPulse_${cleanTicker}_Investment_Memo_${dateStr}.md`,
    mimeType: 'text/markdown',
    content: memoMarkdown,
    folderId,
    accessToken,
  });

  let pdfFile: { id: string; name: string; webViewLink?: string } | undefined;
  if (pdfBlob) {
    pdfFile = await uploadToGoogleDrive({
      name: `AlphaPulse_${cleanTicker}_Investment_Report_${dateStr}.pdf`,
      mimeType: 'application/pdf',
      content: pdfBlob,
      folderId,
      accessToken,
    });
  }

  return { folderId, memoFile, pdfFile };
}
