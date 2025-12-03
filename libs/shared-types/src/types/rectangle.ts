export interface RectangleItem {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly isOutOfBounds?: boolean;
}
