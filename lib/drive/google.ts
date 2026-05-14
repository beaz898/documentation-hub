import { extractText } from '@/lib/chunking';
import type { DriveFile, DriveFolder, DriveProvider, DriveTokens } from './types';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'text/html': 'html',
  'application/json': 'json',
  'application/vnd.google-apps.document': 'gdoc',
};

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'html']);

async function listFilesRecursive(
  accessToken: string,
  folderId: string,
  currentPath: string,
  parentId: string | null,
): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime)&orderBy=name&pageSize=1000`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => 'no body');
    console.error(`[DRIVE SYNC] Google API error ${res.status}:`, errText);
    return allFiles;
  }

  const data = await res.json();
  const files: Array<{ id: string; name: string; mimeType: string; modifiedTime: string }> = data.files || [];
  console.log(`[DRIVE SYNC] Folder ${folderId}: ${files.length} items found`);

  for (const file of files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const subPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const subFiles = await listFilesRecursive(accessToken, file.id, subPath, file.id);
      allFiles.push(...subFiles);
    } else if (
      ALLOWED_MIME_TYPES[file.mimeType] ||
      ALLOWED_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '')
    ) {
      allFiles.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        isFolder: false,
        parentId: parentId ?? undefined,
        folderPath: currentPath || '/',
      });
    }
  }

  return allFiles;
}

export const googleDriveProvider: DriveProvider = {
  name: 'google_drive',
  displayName: 'Google Drive',

  buildAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);
    return authUrl.toString();
  },

  async exchangeCodeForTokens(code: string): Promise<DriveTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Token exchange failed: ${errText}`);
    }
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<DriveTokens> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken, // refresh tokens are long-lived; keep the existing one
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  },

  async listFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
    return listFilesRecursive(accessToken, folderId, '', null);
  },

  async listFolders(accessToken: string, parentId: string): Promise<DriveFolder[]> {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&orderBy=name`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const folders: DriveFolder[] = [];
    for (const folder of (data.files || []) as Array<{ id: string; name: string }>) {
      const countRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+trashed=false&fields=files(id)&pageSize=1000`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const countData = await countRes.json();
      folders.push({ id: folder.id, name: folder.name, fileCount: (countData.files || []).length });
    }
    return folders;
  },

  async downloadFile(accessToken: string, fileId: string, mimeType: string): Promise<string> {
    let fileBuffer: Buffer;
    let ext: string;

    if (mimeType === 'application/vnd.google-apps.document') {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`Google Docs export failed: ${res.status}`);
      fileBuffer = Buffer.from(await res.arrayBuffer());
      ext = 'txt';
    } else {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`File download failed: ${res.status}`);
      fileBuffer = Buffer.from(await res.arrayBuffer());
      ext = ALLOWED_MIME_TYPES[mimeType] || 'txt';
    }

    return extractText(fileBuffer, `file.${ext}`);
  },

  async getUserEmail(accessToken: string): Promise<string> {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return '';
    const data = await res.json();
    return (data.email as string) || '';
  },
};
