import type { ExtractedSegment } from '@/lib/chunking';

import type { ResultadoDelListado } from './sync-guard';

export interface DriveProvider {
  name: string;
  displayName: string;
  buildAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<DriveTokens>;
  refreshAccessToken(refreshToken: string): Promise<DriveTokens>;
  /**
   * ⚠️ DEVUELVE UN RESULTADO, NO UNA LISTA, y ahí está el arreglo del 01/09.
   *
   * Con `Promise<DriveFile[]>` no había forma de decir «falló»: las dos
   * implementaciones acabaron devolviendo `[]`, y un listado vacío significa
   * en la ruta «el usuario borró todo» — o sea BORRAR EL CORPUS. Un 500 de un
   * segundo bastaba. Ver `lib/drive/sync-guard.ts`.
   *
   * REGLA PARA QUIEN IMPLEMENTE UN PROVEEDOR NUEVO: `ok: false` ante CUALQUIER
   * fallo, incluido el de una subcarpeta o el de una página intermedia. Una
   * lista a la que le faltan ficheros es peor que ninguna: a los que faltan se
   * les borra.
   */
  listFiles(accessToken: string, folderId: string): Promise<ResultadoDelListado>;
  listFolders(accessToken: string, parentId: string): Promise<DriveFolder[]>;
  downloadFile(accessToken: string, fileId: string, mimeType: string): Promise<ExtractedSegment[]>;
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
