import line from 'd3-shape/src/line';
import { monotoneX } from 'd3-shape/src/curve/monotone';

/**
 * Layer 2: segment interpolation.
 *
 * An aligned dataset (numbers and null holes) is split into runs of
 * consecutive valid points. Each run with 2+ points becomes an
 * interpolated path; a run with a single point cannot be interpolated
 * and is returned as-is so the caller can render it as a dot.
 */

export const splitSegments = (data = []) => {
  const segments = [];
  let current = [];
  data.forEach((value, index) => {
    if (value === null || value === undefined) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push({ index, value });
    }
  });
  if (current.length > 0) segments.push(current);
  return segments;
};

export const buildSegmentPath = (segment, xPositions, yScale, curve = monotoneX) => {
  if (segment.length < 2) return null;
  const generator = line()
    .x((point) => xPositions[point.index])
    .y((point) => yScale(point.value))
    .curve(curve);
  return generator(segment);
};

export default {
  splitSegments,
  buildSegmentPath,
};
