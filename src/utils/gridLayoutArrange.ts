import type {
  ImageWithOrientation,
  Orientation,
  ImageWithLayout,
} from "../utils/types";

/**
 * Determines if an image is portrait or landscape
 */
function getOrientation(aspectRatio: number): Orientation {
  return aspectRatio < 1 ? "portrait" : "landscape";
}

/**
 * Attempts to match a row pattern starting at the given index
 * Returns the number of images consumed and their col-spans, or null if no match
 */
function tryMatchPattern(
  images: ImageWithOrientation[],
  startIndex: number,
): { count: number; colSpans: number[] } | null {
  const remaining = images.slice(startIndex);

  if (remaining.length === 0) return null;

  const orientations = remaining.map((img) => getOrientation(img.aspectRatio));

  // Pattern 1: portrait (2) + landscape (4)
  if (
    remaining.length >= 2 &&
    orientations[0] === "portrait" &&
    orientations[1] === "landscape"
  ) {
    return { count: 2, colSpans: [2, 4] };
  }

  // Pattern 2: landscape (4) + portrait (2)
  if (
    remaining.length >= 2 &&
    orientations[0] === "landscape" &&
    orientations[1] === "portrait"
  ) {
    return { count: 2, colSpans: [4, 2] };
  }

  // Pattern 3: portrait (2) + portrait (2) + portrait (2)
  if (
    remaining.length >= 3 &&
    orientations[0] === "portrait" &&
    orientations[1] === "portrait" &&
    orientations[2] === "portrait"
  ) {
    return { count: 3, colSpans: [2, 2, 2] };
  }

  // Pattern 4: landscape (3) + landscape (3)
  if (
    remaining.length >= 2 &&
    orientations[0] === "landscape" &&
    orientations[1] === "landscape"
  ) {
    return { count: 2, colSpans: [3, 3] };
  }

  // Pattern 5: landscape (6) - full width
  if (orientations[0] === "landscape") {
    return { count: 1, colSpans: [6] };
  }

  // Pattern 6: portrait (6) - full width
  if (orientations[0] === "portrait") {
    return { count: 1, colSpans: [6] };
  }

  return null;
}

/**
 * Arranges images into grid layout patterns with appropriate col-spans
 * The grid has 6 columns with these possible row combinations:
 * - portrait 1/3 (col-span-2) : landscape 2/3 (col-span-4)
 * - landscape 2/3 (col-span-4) : portrait 1/3 (col-span-2)
 * - portrait 1/3 (col-span-2) : portrait 1/3 (col-span-2) : portrait 1/3 (col-span-2)
 * - landscape 1/2 (col-span-3) : landscape 1/2 (col-span-3)
 * - landscape 1/1 (col-span-6)
 * - portrait 1/1 (col-span-6)
 */
export function arrangeImagesInGrid(
  images: ImageWithOrientation[],
): ImageWithLayout[] {
  const result: ImageWithLayout[] = [];
  let currentIndex = 0;
  let currentRow = 1;

  while (currentIndex < images.length) {
    const match = tryMatchPattern(images, currentIndex);

    if (!match) {
      // Fallback: if no pattern matches (shouldn't happen), give it full width
      result.push({
        ...images[currentIndex],
        colSpan: 6,
        rowStart: currentRow,
      });
      currentIndex++;
      currentRow++;
      continue;
    }

    // Add matched images with their col-spans
    for (let i = 0; i < match.count; i++) {
      result.push({
        ...images[currentIndex + i],
        colSpan: match.colSpans[i],
        rowStart: currentRow,
      });
    }

    currentIndex += match.count;
    currentRow++;
  }

  return result;
}
