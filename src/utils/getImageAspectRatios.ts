import sharp from 'sharp';

export interface ImageAspectRatio {
  cloudflareId: string;
  aspectRatio: number;
  width: number;
  height: number;
}

/**
 * Fetches a single image and returns its aspect ratio and dimensions
 */
export async function getImageAspectRatio(cloudflareId: string): Promise<ImageAspectRatio> {
  const imageUrl = `https://imagedelivery.net/tfgleCjJafHVtd2F4ngDnQ/${cloudflareId}/small`;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    const aspectRatio = metadata.width / metadata.height;

    return {
      cloudflareId,
      aspectRatio,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    console.error(`Error getting aspect ratio for ${cloudflareId}:`, error);
    throw error;
  }
}

/**
 * Fetches multiple images and returns a Map of cloudflareId to aspect ratio data
 */
export async function getImageAspectRatios(cloudflareIds: string[]): Promise<Map<string, ImageAspectRatio>> {
  const results = await Promise.all(
    cloudflareIds.map(id => getImageAspectRatio(id))
  );

  return new Map(results.map(result => [result.cloudflareId, result]));
}

/**
 * Fetches multiple images and returns an array of aspect ratio data in the same order
 */
export async function getImageAspectRatiosArray(cloudflareIds: string[]): Promise<ImageAspectRatio[]> {
  return Promise.all(
    cloudflareIds.map(id => getImageAspectRatio(id))
  );
}
