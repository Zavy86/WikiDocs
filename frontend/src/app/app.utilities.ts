const imageAttachmentExtensionsByMimeType:ReadonlyMap<string, string> = new Map<string, string>([
  [ 'image/apng', 'apng' ],
  [ 'image/avif', 'avif' ],
  [ 'image/bmp', 'bmp' ],
  [ 'image/gif', 'gif' ],
  [ 'image/vnd.microsoft.icon', 'ico' ],
  [ 'image/x-icon', 'ico' ],
  [ 'image/jpeg', 'jpg' ],
  [ 'image/png', 'png' ],
  [ 'image/svg+xml', 'svg' ],
  [ 'image/webp', 'webp' ],
]);

export const IMAGE_ATTACHMENT_EXTENSIONS:ReadonlySet<string> = new Set<string>(imageAttachmentExtensionsByMimeType.values());

export function getImageAttachmentExtensionFromMimeType(mimeType:string):string | null {
  return imageAttachmentExtensionsByMimeType.get(mimeType.trim().toLowerCase()) ?? null;
}

export function isImageAttachmentFileName(fileName:string):boolean {
  const extension:string = fileName.trim().split('.').at(-1)?.toLowerCase() ?? '';
  return IMAGE_ATTACHMENT_EXTENSIONS.has(extension);
}
