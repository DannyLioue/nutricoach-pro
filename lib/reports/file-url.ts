import { join, normalize } from 'path';

export function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

export function resolvePublicFileAbsolutePath(fileUrl: string): string {
  const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
  const normalizedPath = normalize(relativePath);
  if (!normalizedPath.startsWith('uploads/')) {
    throw new Error('invalid report file path');
  }
  return join(process.cwd(), 'public', normalizedPath);
}
