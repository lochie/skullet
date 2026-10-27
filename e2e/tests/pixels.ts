import { PNG } from "pngjs";

/** How much a screenshot's pixels vary — near 0 for a blank region, well above it once anything is drawn. */
export function spread(png: Buffer): number {
  const { data, width, height } = PNG.sync.read(png);
  let sum = 0;
  let squares = 0;
  const count = width * height;
  for (let i = 0; i < data.length; i += 4) {
    const luma =
      0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    sum += luma;
    squares += luma * luma;
  }
  const mean = sum / count;
  return Math.sqrt(Math.max(squares / count - mean * mean, 0));
}
