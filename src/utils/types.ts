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

export const dateOptionsWithTime: object = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
};

// formats the date as dd/mm/yy
export const shortDateOptions: object = {
  day: "numeric",
  month: "numeric",
  year: "2-digit",
};

// formats the date as e.g. 2 June
export const dateMonthOptions: object = {
  day: "numeric",
  month: "long",
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

/**
 * Sorts stream posts newest-first by their "YEAR/DAY" id
 */
export function sortStreamByDate<T extends { id: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const [yearA, dayA] = a.id.split("/").map(Number);
    const [yearB, dayB] = b.id.split("/").map(Number);
    if (yearB !== yearA) return yearB - yearA;
    return dayB - dayA;
  });
}
