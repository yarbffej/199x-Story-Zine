import React, { useState, useEffect } from 'react';
import { 
  FolderCheck, 
  ExternalLink, 
  LogOut, 
  Check, 
  Settings2, 
  Cloud, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  googleSignOut, 
  initAuth, 
  getAccessToken,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_DRIVE_FOLDER_NAME,
  DEFAULT_DRIVE_FOLDER_URL,
  extractDriveFolderId
} from '../services/googleDrive';

interface GoogleDrivePanelProps {
  onUserChange?: (user: User | null, token: string | null) => void;
  onFolderChange?: (folderName: string) => void;
  onAutoUploadToggle?: (enabled: boolean) => void;
  folderName: string;
  autoUpload: boolean;
}

export const GoogleDrivePanel: React.FC<GoogleDrivePanelProps> = ({
  onUserChange,
  onFolderChange,
  onAutoUploadToggle,
  folderName,
  autoUpload
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingFolder, setIsEditingFolder] = useState<boolean>(false);
  const [tempFolder, setTempFolder] = useState<string>(folderName);

  useEffect(() => {
    setTempFolder(folderName);
  }, [folderName]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        if (onUserChange) onUserChange(authUser, authToken);
      },
      () => {
        setUser(null);
        setToken(null);
        if (onUserChange) onUserChange(null, null);
      }
    );
    return () => unsubscribe();
  }, [onUserChange]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setToken(result.accessToken);
      if (onUserChange) onUserChange(result.user, result.accessToken);
    } catch (err: any) {
      console.error('Google Sign-in failure:', err);
      setErrorMessage(err?.message || 'Authentication was interrupted or canceled.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      if (onUserChange) onUserChange(null, null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  const handleSaveFolderName = () => {
    const raw = tempFolder.trim();
    const extracted = extractDriveFolderId(raw);
    const finalName = extracted ? extracted : (raw || DEFAULT_DRIVE_FOLDER_ID);
    setTempFolder(finalName);
    setIsEditingFolder(false);
    if (onFolderChange) onFolderChange(finalName);
  };

  const isUserTargetFolder = 
    !folderName || 
    folderName === DEFAULT_DRIVE_FOLDER_ID || 
    folderName.toLowerCase() === 'trading cards' ||
    folderName.includes(DEFAULT_DRIVE_FOLDER_ID);

  const activeFolderUrl = isUserTargetFolder 
    ? DEFAULT_DRIVE_FOLDER_URL 
    : (extractDriveFolderId(folderName) ? `https://drive.google.com/drive/folders/${extractDriveFolderId(folderName)}` : 'https://drive.google.com');

  const displayFolderName = isUserTargetFolder 
    ? DEFAULT_DRIVE_FOLDER_NAME 
    : (folderName.length > 25 ? `${folderName.slice(0, 10)}...${folderName.slice(-6)}` : folderName);

  return (
    <div 
      id="google-drive-sync-panel"
      className="p-4 sm:p-5 rounded-2xl border font-mono transition-all duration-200 bg-zinc-950/90 backdrop-blur-md"
      style={{
        borderColor: user ? '#39FF14' : '#00F0FF',
        boxShadow: user 
          ? '0 0 25px rgba(57, 255, 20, 0.15), inset 0 0 15px rgba(57, 255, 20, 0.05)'
          : '0 0 25px rgba(0, 240, 255, 0.15), inset 0 0 15px rgba(0, 240, 255, 0.05)'
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-zinc-950"
              style={{ background: user ? '#39FF14' : '#00F0FF' }}
            >
              {user ? 'DRIVE LINK // ONLINE' : 'DRIVE LINK // STANDBY'}
            </span>
            <span className="text-zinc-400 text-xs">
              Google Drive Cloud Vault
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span>Automatic Trading Card Cloud Storage</span>
          </h3>

          <p className="text-xs text-zinc-400 max-w-xl">
            {user ? (
              <span>
                Cards upload directly into your designated Google Drive folder:{' '}
                <a
                  href={activeFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 underline font-bold inline-flex items-center gap-1"
                >
                  "{displayFolderName}"
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </span>
            ) : (
              'Connect your Google Drive account to automatically back up high-resolution holographic trading cards directly to your designated Trading Cards folder.'
            )}
          </p>
        </div>

        {/* Right: Auth Action */}
        <div className="flex items-center gap-2">
          {!user ? (
            <button
              type="button"
              id="google-drive-sign-in-btn"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-100 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {/* Official Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'CONNECTING DRIVE...' : 'Connect Google Drive'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[11px] text-zinc-300 font-bold block truncate max-w-[180px]">
                  {user.displayName || user.email}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ● Drive Authorized
                </span>
              </div>

              <button
                type="button"
                id="google-drive-sign-out-btn"
                onClick={handleSignOut}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition-colors"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-950/80 border border-red-700/80 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target Folder & Auto-Upload Settings (When connected) */}
      {user && (
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Target Folder Config */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-bold flex items-center gap-1.5">
              <FolderCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>Target Folder:</span>
            </span>

            {isEditingFolder ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  id="target-folder-input"
                  value={tempFolder}
                  onChange={(e) => setTempFolder(e.target.value)}
                  placeholder={`Folder name or ID (${DEFAULT_DRIVE_FOLDER_ID})`}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-cyan-500 text-zinc-100 font-mono text-xs w-72 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveFolderName();
                    if (e.key === 'Escape') setIsEditingFolder(false);
                  }}
                />
                <button
                  type="button"
                  id="save-folder-btn"
                  onClick={handleSaveFolderName}
                  className="px-2.5 py-1 rounded bg-cyan-500 text-zinc-950 font-bold hover:bg-cyan-400 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Set</span>
                </button>
                <button
                  type="button"
                  id="reset-folder-btn"
                  onClick={() => {
                    setTempFolder(DEFAULT_DRIVE_FOLDER_ID);
                    if (onFolderChange) onFolderChange(DEFAULT_DRIVE_FOLDER_ID);
                    setIsEditingFolder(false);
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white text-xs cursor-pointer"
                  title="Reset to default Trading Cards folder"
                >
                  Reset Default
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={activeFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-yellow-300 hover:text-yellow-200 font-mono font-bold inline-flex items-center gap-1 transition-colors"
                  title="Open folder in Google Drive"
                >
                  <span>{displayFolderName}</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </a>
                <button
                  type="button"
                  id="edit-folder-btn"
                  onClick={() => setIsEditingFolder(true)}
                  className="text-zinc-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto-Upload Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300">
              <input
                type="checkbox"
                id="auto-upload-drive-toggle"
                checked={autoUpload}
                onChange={(e) => {
                  if (onAutoUploadToggle) onAutoUploadToggle(e.target.checked);
                }}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-pink-500 focus:ring-pink-500 cursor-pointer"
              />
              <span>Auto-upload to Drive on card download</span>
            </label>

            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] underline underline-offset-2 ml-2"
            >
              <span>Drive Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
