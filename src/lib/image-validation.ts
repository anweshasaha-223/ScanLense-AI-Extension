export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Validates that binary bytes match the expected image magic signatures.
 */
export function validateImageMagicBytes(
  bytes: Uint8Array,
  declaredMime: string
): { valid: boolean; detectedMime?: string; error?: string } {
  if (bytes.length < 12) {
    return { valid: false, error: 'File is too small to be a valid image header.' };
  }

  // PNG check: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  if (isPng) {
    if (declaredMime !== 'image/png') {
      return {
        valid: false,
        detectedMime: 'image/png',
        error: `Declared MIME type (${declaredMime}) does not match PNG signature.`,
      };
    }
    return { valid: true, detectedMime: 'image/png' };
  }

  // JPEG check: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) {
    if (declaredMime !== 'image/jpeg') {
      return {
        valid: false,
        detectedMime: 'image/jpeg',
        error: `Declared MIME type (${declaredMime}) does not match JPEG signature.`,
      };
    }
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // WebP check: 'RIFF' .... 'WEBP'
  const isRiff =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp =
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (isRiff && isWebp) {
    if (declaredMime !== 'image/webp') {
      return {
        valid: false,
        detectedMime: 'image/webp',
        error: `Declared MIME type (${declaredMime}) does not match WebP signature.`,
      };
    }
    return { valid: true, detectedMime: 'image/webp' };
  }

  return {
    valid: false,
    error: 'Unrecognized image format. Only PNG, JPEG, and WebP files are supported.',
  };
}

/**
 * Validates base64 image data payload.
 */
export function validateBase64Image(
  base64Data: string,
  declaredMimeType: string
): { valid: boolean; error?: string; bytes?: Uint8Array } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(declaredMimeType as AllowedImageMimeType)) {
    return {
      valid: false,
      error: `Unsupported image MIME type: ${declaredMimeType}. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
    };
  }

  // Strip data:image/...;base64, prefix if present
  let cleanBase64 = base64Data;
  const prefixMatch = cleanBase64.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,/);
  if (prefixMatch) {
    cleanBase64 = cleanBase64.slice(prefixMatch[0].length);
  }
  cleanBase64 = cleanBase64.trim();

  // Basic base64 character check
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64.replace(/\s+/g, ''))) {
    return {
      valid: false,
      error: 'Corrupted image data: Base64 payload contains invalid characters.',
    };
  }

  // Check approximate decoded size
  const approximateBytes = (cleanBase64.length * 3) / 4;
  if (approximateBytes > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Image exceeds maximum allowed size of 4MB (received ~${Math.round(approximateBytes / 1024 / 1024)}MB).`,
    };
  }

  try {
    // Decode first 32 bytes for magic byte check
    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(cleanBase64, 'base64');
      bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    } else {
      const binaryString = atob(cleanBase64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    }

    if (bytes.length > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: `Decoded image exceeds 4MB limit.`,
      };
    }

    const magicCheck = validateImageMagicBytes(bytes, declaredMimeType);
    if (!magicCheck.valid) {
      return { valid: false, error: magicCheck.error };
    }

    return { valid: true, bytes };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to decode base64 image: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
