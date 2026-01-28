export interface ImageWithOrientation {
  cloudflareId: string;
  aspectRatio: number;
  width: number;
  height: number;
}

export interface ImageWithLayout extends ImageWithOrientation {
  colSpan: number;
  rowStart?: number;
}

export type Orientation = "portrait" | "landscape";

export const dateOptions: object = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

// formats the date as dd/mm/yy
export const shortDateOptions: object = {
  day: "numeric",
  month: "numeric",
  year: "2-digit",
};

/**
 * Converts a post ID in "YEAR/DAY" format to a Date object
 * e.g., "2026/1" = January 1st 2026, "2026/33" = February 2nd 2026
 */
export function parseDateFromId(id: string): Date {
  const [year, dayOfYear] = id.split("/").map(Number);
  const date = new Date(year, 0, dayOfYear);
  return date;
}
