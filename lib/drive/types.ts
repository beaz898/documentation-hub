export interface DriveProvider {
  name: string;
  displayName: string;
  buildAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<DriveTokens>;
  refreshAccessToken(refreshToken: string): Promise<DriveTokens>;
  listFiles(accessToken: string, folderId: string): Promise<DriveFile[]>;
  listFolders(accessToken: string, parentId: string): Promise<DriveFolder[]>;
  downloadFile(accessToken: string, fileId: string, mimeType: string): Promise<string>;
  getUserEmail(accessToken: string): Promise<string>;
}

export interface DriveTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  isFolder: boolean;
  parentId?: string;
  folderPath?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  fileCount: number;
}
