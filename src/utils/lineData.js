/**
 * Layer 1: data normalization for line charts.
 *
 * Turns raw { labels, datasets } input into a canonical form:
 * - duplicate x labels are merged (first-occurrence order wins for the axis,
 *   the last non-empty value wins for each dataset);
 * - every dataset is aligned to the deduplicated labels;
 * - null / undefined / non-numeric values become null (a "hole");
 * - the y domain is computed from finite values only and is always a
 *   non-degenerate [min, max] pair.
 */

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const labelKey = (label) => String(label);

export const normalizeLabels = (labels = []) => {
  const seen = new Set();
  const uniqueLabels = [];
  labels.forEach((label) => {
    const key = labelKey(label);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLabels.push(label);
    }
  });
  return uniqueLabels;
};

export const normalizeLineData = (labels = [], datasets = []) => {
  const uniqueLabels = normalizeLabels(labels);

  const normalizedDatasets = datasets.map((dataset) => {
    const valueByKey = new Map();
    labels.forEach((label, i) => {
      const key = labelKey(label);
      const value = toFiniteNumber(dataset.data ? dataset.data[i] : null);
      // last non-empty value wins; an empty value only fills a key
      // that no concrete value has claimed yet
      if (value !== null || !valueByKey.has(key)) {
        valueByKey.set(key, value);
      }
    });
    return {
      ...dataset,
      data: uniqueLabels.map((label) => {
        const value = valueByKey.get(labelKey(label));
        return value === undefined ? null : value;
      }),
    };
  });

  return { labels: uniqueLabels, datasets: normalizedDatasets };
};

export const computeYDomain = (datasets = []) => {
  let min = Infinity;
  let max = -Infinity;
  datasets.forEach((dataset) => {
    dataset.data.forEach((value) => {
      if (value !== null && value !== undefined) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    });
  });
  if (min === Infinity) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
};

export default {
  normalizeLabels,
  normalizeLineData,
  computeYDomain,
};
