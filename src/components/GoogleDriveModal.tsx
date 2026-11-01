import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  ExternalLink,
  X,
  Sparkles,
  LogOut,
  FolderPlus,
  ShieldCheck,
} from 'lucide-react';
import {
  googleSignIn,
  googleLogout,
  saveAppBackupToDrive,
  saveStockMemoToDrive,
} from '../utils/googleDrive';
import { StockQuote, MultiSourceSentiment, ComprehensiveReport, AnalystRating } from '../types/stock';
import { createPdfBlob } from '../utils/generatePdfReport';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentAccessToken: string | null;
  onAuthChanged: (user: User | null, token: string | null) => void;
  quote: StockQuote;
  report: ComprehensiveReport;
  sentiment: MultiSourceSentiment;
  ratings?: AnalystRating[];
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentAccessToken,
  onAuthChanged,
  quote,
  report,
  sentiment,
  ratings = [],
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [lastUploadedLink, setLastUploadedLink] = useState<string | null>(null);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthChanged(res.user, res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out from Google Drive?');
    if (!confirmed) return;
    try {
      await googleLogout();
      onAuthChanged(null, null);
      setLastUploadedLink(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing out.');
    }
  };

  const handleSaveAppBackup = async () => {
    if (!currentAccessToken) {
      await handleSignIn();
      return;
    }

    setIsSavingApp(true);
    setErrorMsg(null);
    setLastUploadedLink(null);

    try {
      const result = await saveAppBackupToDrive(currentAccessToken);
      setLastUploadedLink(result.backupFile.webViewLink || 'https://drive.google.com');
      setLastUploadedName(result.backupFile.name);
    } catch (err: any) {
      console.error('Save app backup error:', err);
      // If token expired, clear and prompt to reconnect
      if (err.message && (err.message.includes('401') || err.message.includes('token'))) {
        onAuthChanged(null, null);
        setErrorMsg('Google Drive session expired. Please sign in again.');
      } else {
        setErrorMsg(err.message || 'Failed to save application backup to Google Drive.');
      }
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleSaveStockMemo = async () => {
    if (!currentAccessToken) {
      await handleSignIn();
      return;
    }

    setIsSavingStock(true);
    setErrorMsg(null);
    setLastUploadedLink(null);

    try {
      // Generate real vector PDF blob to save alongside memo
      let pdfBlob: Blob | undefined;
      try {
        pdfBlob = createPdfBlob({ quote, sentiment, report, ratings });
      } catch (pdfErr) {
        console.warn('PDF blob generation notice:', pdfErr);
      }

      const result = await saveStockMemoToDrive({
        quote,
        report,
        sentiment,
        ratings,
        pdfBlob,
        accessToken: currentAccessToken,
      });

      const primaryLink = result.pdfFile?.webViewLink || result.memoFile.webViewLink || 'https://drive.google.com';
      setLastUploadedLink(primaryLink);
      setLastUploadedName(result.pdfFile ? result.pdfFile.name : result.memoFile.name);
    } catch (err: any) {
      console.error('Save stock memo error:', err);
      if (err.message && (err.message.includes('401') || err.message.includes('token'))) {
        onAuthChanged(null, null);
        setErrorMsg('Google Drive session expired. Please sign in again.');
      } else {
        setErrorMsg(err.message || 'Failed to save stock report to Google Drive.');
      }
    } finally {
      setIsSavingStock(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Save to Google Drive
              </h3>
              <p className="text-xs text-slate-400">
                Direct cloud integration for AlphaPulse terminal
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* User Auth Status / Sign-In */}
          {!currentUser || !currentAccessToken ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 mx-auto flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Connect your Google Account
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Authorizes AlphaPulse to create and store your stock analysis memos and full app backups in your personal Google Drive.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-medium px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all border border-slate-200 disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-9 h-9 rounded-full border border-blue-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 font-bold text-white flex items-center justify-center text-xs">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {currentUser.displayName || 'Google Account Connected'}
                  </p>
                  <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Disconnect Google Drive"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 gap-3.5">
            {/* 1. Save Full App Backup */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Save Complete App Code &amp; Backup
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Packages all source files, documentation, server configuration, and repository details into an organized <span className="text-emerald-400 font-mono">AlphaPulse AI Stock Terminal</span> folder on your Google Drive.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveAppBackup}
                disabled={isSavingApp}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-emerald-500/20 active:scale-95"
              >
                {isSavingApp ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving App Backup to Drive...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Save App Backup to My Drive</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Save Current Stock Report */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Save {quote.ticker} Research Memo &amp; PDF
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Exports the active stock analysis, Buy thesis, valuation verdict, and high-res vector PDF report directly to your Google Drive.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveStockMemo}
                disabled={isSavingStock}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
              >
                {isSavingStock ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving {quote.ticker} Report to Drive...</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    <span>Save {quote.ticker} Memo &amp; PDF to Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {lastUploadedLink && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-200 animate-in fade-in">
              <div className="flex items-center gap-2 overflow-hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Saved: <strong className="text-white">{lastUploadedName || 'File'}</strong>
                </span>
              </div>
              <a
                href={lastUploadedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg font-medium flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Folder: Google Drive &gt; AlphaPulse AI Stock Terminal
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
