import { googleDriveProvider } from './google';
import { oneDriveProvider } from './onedrive';
import type { DriveProvider } from './types';

const providers: Record<string, DriveProvider> = {
  google_drive: googleDriveProvider,
  onedrive: oneDriveProvider,
};

export function getProvider(name: string): DriveProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Proveedor de drive no soportado: ${name}`);
  return provider;
}

export function getAllProviders(): DriveProvider[] {
  return Object.values(providers);
}
