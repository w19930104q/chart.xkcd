import { splitSegments, buildSegmentPath } from './lineSegments';

/**
 * Layer 3: SVG attribute generation.
 *
 * Pure mapping from normalized datasets + scales to the attribute sets
 * of the SVG elements to render. No DOM access happens here, so the
 * output is deterministic and can be hashed/snapshot-tested.
 *
 * Returns { paths, dots }:
 * - paths: one entry per interpolatable segment (2+ consecutive points)
 * - dots:  one entry per isolated single point
 */
export const buildLineAttributes = (datasets = [], {
  xPositions,
  yScale,
  dataColors,
  curve,
  dotRadius = 3.5,
}) => {
  const paths = [];
  const dots = [];

  datasets.forEach((dataset, datasetIndex) => {
    const color = dataColors[datasetIndex % dataColors.length];

    splitSegments(dataset.data).forEach((segment, segmentIndex) => {
      if (segment.length === 1) {
        const point = segment[0];
        dots.push({
          cx: xPositions[point.index],
          cy: yScale(point.value),
          r: dotRadius,
          stroke: color,
          fill: color,
          datasetIndex,
        });
        return;
      }
      paths.push({
        d: buildSegmentPath(segment, xPositions, yScale, curve),
        fill: 'none',
        stroke: color,
        datasetIndex,
        segmentIndex,
      });
    });
  });

  return { paths, dots };
};

export default {
  buildLineAttributes,
};
