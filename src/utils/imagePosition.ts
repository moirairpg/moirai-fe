import smartcrop from '../shared/vendor/smartcrop';

export type ImagePosition = { x: number; y: number };

export const DEFAULT_IMAGE_POSITION: ImagePosition = { x: 0.5, y: 0.35 };

const CARD_CROP_ASPECT = 16 / 9;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const targetCropOf = (width: number, height: number) =>
  width / height > CARD_CROP_ASPECT
    ? { width: Math.round(height * CARD_CROP_ASPECT), height }
    : { width, height: Math.round(width / CARD_CROP_ASPECT) };

export function objectPositionOf(x: number | null | undefined, y: number | null | undefined): string {
  const resolvedX = x ?? DEFAULT_IMAGE_POSITION.x;
  const resolvedY = y ?? DEFAULT_IMAGE_POSITION.y;

  return `${resolvedX * 100}% ${resolvedY * 100}%`;
}

export async function resolveImagePosition(image: Blob): Promise<ImagePosition> {
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(image);

    const target = targetCropOf(bitmap.width, bitmap.height);
    const { topCrop } = await smartcrop.crop(bitmap, target);

    return {
      x: clamp((topCrop.x + topCrop.width / 2) / bitmap.width),
      y: clamp((topCrop.y + topCrop.height / 2) / bitmap.height),
    };
  } catch {
    return { ...DEFAULT_IMAGE_POSITION };
  } finally {
    bitmap?.close();
  }
}
