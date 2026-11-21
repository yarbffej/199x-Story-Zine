import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Defined OAuth scopes for Google Drive
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// User's designated Trading Cards Google Drive Folder ID
export const DEFAULT_DRIVE_FOLDER_ID = '10LpEIZZewD7yoOu4zid3FoSOh8khoRKM';
export const DEFAULT_DRIVE_FOLDER_NAME = 'Trading Cards';
export const DEFAULT_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`;

// Helper to extract a folder ID from raw input (supports URL or bare ID)
export const extractDriveFolderId = (input?: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  // Standard Drive ID is 25+ alphanumeric characters
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

// Lazy or singleton initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token must be acquired via interactive popup credential
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token from authentication provider.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Resolve the correct folder ID to upload into without creating duplicate folders
export const getOrCreateDriveFolder = async (
  folderIdentifier: string,
  accessToken: string
): Promise<{ folderId: string; folderName: string }> => {
  const trimmed = folderIdentifier ? folderIdentifier.trim() : '';

  // 1. Direct match with folder ID or URL provided by user
  const explicitId = extractDriveFolderId(trimmed);
  if (explicitId) {
    return { folderId: explicitId, folderName: DEFAULT_DRIVE_FOLDER_NAME };
  }

  // 2. If it matches the default 'Trading Cards' or empty, use the user's existing folder ID directly
  const isDefaultTradingCards = 
    !trimmed ||
    trimmed.toLowerCase() === 'trading cards' ||
    trimmed.toLowerCase() === 'trading card' ||
    trimmed === DEFAULT_DRIVE_FOLDER_ID;

  if (isDefaultTradingCards) {
    return { folderId: DEFAULT_DRIVE_FOLDER_ID, folderName: DEFAULT_DRIVE_FOLDER_NAME };
  }

  // 3. For any other custom folder name, search if an accessible folder with that name already exists
  try {
    const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${trimmed.replace(/'/g, "\\'")}' and trashed=false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&spaces=drive`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return { folderId: searchData.files[0].id, folderName: searchData.files[0].name };
      }
    }
  } catch (err) {
    console.warn('Google Drive folder search exception, proceeding to create folder:', err);
  }

  // 4. Create custom folder ONLY if a non-default custom folder name was explicitly requested and not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: trimmed,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    // If creation fails (e.g. scope restrictions), fallback safely to user's known folder
    return { folderId: DEFAULT_DRIVE_FOLDER_ID, folderName: DEFAULT_DRIVE_FOLDER_NAME };
  }

  const newFolder = await createRes.json();
  return { folderId: newFolder.id, folderName: trimmed };
};

export interface DriveUploadResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  folderId: string;
  folderName: string;
}

// Upload Card PNG blob directly into Google Drive folder via multipart upload
export const uploadCardPngToDrive = async ({
  blob,
  fileName,
  folderName = DEFAULT_DRIVE_FOLDER_NAME,
  folderId: explicitFolderId,
  accessToken
}: {
  blob: Blob;
  fileName: string;
  folderName?: string;
  folderId?: string;
  accessToken: string;
}): Promise<DriveUploadResult> => {
  let targetFolderId = explicitFolderId;
  let targetFolderName = DEFAULT_DRIVE_FOLDER_NAME;

  if (!targetFolderId) {
    const resolved = await getOrCreateDriveFolder(folderName, accessToken);
    targetFolderId = resolved.folderId;
    targetFolderName = resolved.folderName;
  }

  const boundary = `-------199xDriveBoundary${Date.now()}`;

  const metadata = {
    name: fileName.endsWith('.png') ? fileName : `${fileName}.png`,
    parents: [targetFolderId],
    mimeType: 'image/png'
  };

  // Multipart request according to RFC 2046 and Google Drive REST API specifications
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaPartHeader = `--${boundary}\r\nContent-Type: image/png\r\n\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBlob = new Blob([
    metadataPart,
    mediaPartHeader,
    blob,
    closeDelimiter
  ], { type: `multipart/related; boundary=${boundary}` });

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBlob
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Drive upload failed: ${errText}`);
  }

  const uploadedData = await uploadRes.json();
  return {
    fileId: uploadedData.id,
    name: uploadedData.name,
    webViewLink: uploadedData.webViewLink || `https://drive.google.com/file/d/${uploadedData.id}/view`,
    folderId: targetFolderId,
    folderName: targetFolderName
  };
};
