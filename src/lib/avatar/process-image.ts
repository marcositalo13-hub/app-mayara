// Client-only: turns any picked photo into a small square avatar.
// Re-encoding through a canvas drops ALL metadata (EXIF, GPS, camera info): the original
// file is never uploaded.

export const AVATAR_SIZE = 512;
export const MAX_INPUT_BYTES = 15 * 1024 * 1024; // rejected before decoding
const QUALITY = 0.85;

export type ProcessedAvatar = {
  blob: Blob;
  contentType: "image/webp" | "image/jpeg";
  extension: "webp" | "jpg";
};

export class AvatarError extends Error {}

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

/** Decodes with the EXIF orientation applied (so phone photos aren't sideways). */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to the <img> path (older WebKit, unusual formats the bitmap decoder rejects).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode(); // modern browsers apply EXIF orientation to <img> by default
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new AvatarError("Não foi possível ler esta imagem. Tente outra foto.");
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

export async function processAvatar(file: File): Promise<ProcessedAvatar> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new AvatarError("Esta foto é muito grande (máximo 15 MB). Escolha outra.");
  }
  if (file.type && !file.type.startsWith("image/")) {
    throw new AvatarError("Escolha uma imagem (foto).");
  }

  const decoded = await decode(file);
  try {
    if (!decoded.width || !decoded.height) {
      throw new AvatarError("Não foi possível ler esta imagem. Tente outra foto.");
    }

    // Center-crop to a square, then downscale.
    const side = Math.min(decoded.width, decoded.height);
    const sx = (decoded.width - side) / 2;
    const sy = (decoded.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new AvatarError("Seu navegador não conseguiu preparar a foto.");
    ctx.imageSmoothingQuality = "high";

    const draw = (opaque: boolean) => {
      ctx.clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
      if (opaque) {
        // JPEG has no alpha: a transparent PNG would turn black. (Image data, not UI color.)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
      }
      ctx.drawImage(decoded.source, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    };

    // WebP first; Safari may silently return PNG, so verify the type and fall back to JPEG.
    draw(false);
    const webp = await toBlob(canvas, "image/webp");
    if (webp && webp.type === "image/webp") {
      return { blob: webp, contentType: "image/webp", extension: "webp" };
    }

    draw(true);
    const jpeg = await toBlob(canvas, "image/jpeg");
    if (jpeg && jpeg.type === "image/jpeg") {
      return { blob: jpeg, contentType: "image/jpeg", extension: "jpg" };
    }
    throw new AvatarError("Não foi possível preparar a foto. Tente outra.");
  } finally {
    decoded.close();
  }
}
