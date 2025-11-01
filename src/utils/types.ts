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
