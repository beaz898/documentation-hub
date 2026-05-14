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
};

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'html']);

const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const MS_SCOPE = 'Files.Read Files.Read.All User.Read offline_access';

interface GraphItem {
  id: string;
  name: string;
  file?: { mimeType: string };
  folder?: { childCount: number };
  lastModifiedDateTime: string;
  parentReference?: { id: string };
}

interface GraphListResponse {
  value: GraphItem[];
  '@odata.nextLink'?: string;
}

async function graphGet(url: string, accessToken: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`MS Graph error ${res.status}: ${errText}`);
  }
  return res.json();
}

async function listItemsRecursive(
  accessToken: string,
  folderId: string,
  currentPath: string,
  parentId: string | null,
): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];

  let url: string = folderId === 'root'
    ? `${GRAPH_BASE}/me/drive/root/children?$select=id,name,file,folder,lastModifiedDateTime,parentReference&$top=200`
    : `${GRAPH_BASE}/me/drive/items/${folderId}/children?$select=id,name,file,folder,lastModifiedDateTime,parentReference&$top=200`;

  while (url) {
    let data: GraphListResponse;
    try {
      data = await graphGet(url, accessToken) as GraphListResponse;
    } catch (err) {
      console.error(`[ONEDRIVE SYNC] Error listing folder ${folderId}:`, err);
      break;
    }

    const items = data.value || [];
    console.log(`[ONEDRIVE SYNC] Folder ${folderId}: ${items.length} items`);

    for (const item of items) {
      if (item.folder) {
        const subPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        const subFiles = await listItemsRecursive(accessToken, item.id, subPath, item.id);
        allFiles.push(...subFiles);
      } else if (item.file) {
        const mimeType = item.file.mimeType || '';
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        if (ALLOWED_MIME_TYPES[mimeType] || ALLOWED_EXTENSIONS.has(ext)) {
          allFiles.push({
            id: item.id,
            name: item.name,
            mimeType,
            modifiedTime: item.lastModifiedDateTime,
            isFolder: false,
            parentId: parentId ?? undefined,
            folderPath: currentPath || '/',
          });
        }
      }
    }

    url = data['@odata.nextLink'] || '';
  }

  return allFiles;
}

export const oneDriveProvider: DriveProvider = {
  name: 'onedrive',
  displayName: 'OneDrive',

  buildAuthUrl(state: string): string {
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', process.env.MICROSOFT_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', process.env.MICROSOFT_REDIRECT_URI!);
    authUrl.searchParams.set('scope', MS_SCOPE);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent');
    return authUrl.toString();
  },

  async exchangeCodeForTokens(code: string): Promise<DriveTokens> {
    const res = await fetch(MS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`MS token exchange failed: ${errText}`);
    }
    const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<DriveTokens> {
    const res = await fetch(MS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: MS_SCOPE,
      }),
    });
    if (!res.ok) throw new Error('MS token refresh failed');
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: data.access_token,
      // MS may issue a new refresh token; fall back to the existing one
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  },

  async getUserEmail(accessToken: string): Promise<string> {
    try {
      const data = await graphGet(
        `${GRAPH_BASE}/me?$select=mail,userPrincipalName`,
        accessToken,
      ) as { mail?: string; userPrincipalName?: string };
      return data.mail || data.userPrincipalName || '';
    } catch {
      return '';
    }
  },

  async listFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
    return listItemsRecursive(accessToken, folderId, '', null);
  },

  async listFolders(accessToken: string, parentId: string): Promise<DriveFolder[]> {
    const url = parentId === 'root'
      ? `${GRAPH_BASE}/me/drive/root/children?$select=id,name,folder&$top=200`
      : `${GRAPH_BASE}/me/drive/items/${parentId}/children?$select=id,name,folder&$top=200`;
    try {
      const data = await graphGet(url, accessToken) as GraphListResponse;
      return (data.value || [])
        .filter(item => item.folder)
        .map(item => ({
          id: item.id,
          name: item.name,
          fileCount: item.folder?.childCount ?? 0,
        }));
    } catch {
      return [];
    }
  },

  async downloadFile(accessToken: string, fileId: string, mimeType: string): Promise<string> {
    const res = await fetch(`${GRAPH_BASE}/me/drive/items/${fileId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`OneDrive download failed: ${res.status}`);
    const ext = ALLOWED_MIME_TYPES[mimeType] || 'txt';
    const fileBuffer = Buffer.from(await res.arrayBuffer());
    return extractText(fileBuffer, `file.${ext}`);
  },
};
