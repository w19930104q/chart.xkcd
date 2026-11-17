/**
 * Deterministic render verification for the Line chart.
 *
 * Renders a fixed dataset (null holes, duplicate x labels, a
 * single-point series and an all-null series) twice under jsdom,
 * exports path segment count, axis ticks and dimensions, and
 * sha256-hashes both runs to prove the output is stable.
 *
 * Run via: npm run verify:line
 */
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import Line from '../src/Line.js';

const FIXED_INPUT = {
  title: 'line verify',
  xLabel: 'x',
  yLabel: 'y',
  data: {
    // duplicate 'c' at the end on purpose
    labels: ['a', 'b', 'c', 'd', 'e', 'f', 'c'],
    datasets: [
      // holes + duplicate-x override (last non-null 'c' value = 9 wins)
      { label: 's1', data: [3, null, 5, 2, null, 4, 9] },
      // single valid point (on the duplicated 'c')
      { label: 's2', data: [null, null, null, null, null, null, 7] },
      // all-null series: must not corrupt the y domain
      { label: 's3', data: [null, null, null, null, null, null, null] },
    ],
  },
  options: { yTickCount: 3 },
};

const CLIENT_WIDTH = 600;
const INNER_HEIGHT = 400;

function renderOnce() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div><svg id="chart"></svg></div></body></html>',
  );
  const { window } = dom;
  // jsdom does not implement layout; stub what the render path reads
  window.SVGElement.prototype.getBBox = () => ({
    x: 0, y: 0, width: 10, height: 10,
  });
  window.SVGElement.prototype.getComputedTextLength = () => 10;
  Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return CLIENT_WIDTH; },
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: INNER_HEIGHT,
  });
  globalThis.window = window;
  globalThis.document = window.document;

  const svg = window.document.getElementById('chart');
  const chart = new Line(svg, FIXED_INPUT);

  const axisGroups = [...svg.querySelectorAll('g')]
    .filter((g) => [...g.children].some((c) => c.classList.contains('tick')));
  const tickTexts = (g) => [...g.querySelectorAll('.tick > text')]
    .map((t) => t.textContent);

  return {
    dimensions: {
      svgWidth: svg.getAttribute('width'),
      svgHeight: svg.getAttribute('height'),
      plotWidth: chart.width,
      plotHeight: chart.height,
    },
    normalizedLabels: chart.data.labels,
    normalizedData: chart.data.datasets.map((dataset) => dataset.data),
    pathSegmentCount: svg.querySelectorAll('path.xkcd-chart-line').length,
    paths: [...svg.querySelectorAll('path.xkcd-chart-line')]
      .map((p) => p.getAttribute('d')),
    dotCount: svg.querySelectorAll('circle.xkcd-chart-dot').length,
    dots: [...svg.querySelectorAll('circle.xkcd-chart-dot')]
      .map((c) => [c.getAttribute('cx'), c.getAttribute('cy')]),
    xTicks: tickTexts(axisGroups[0]),
    yTicks: tickTexts(axisGroups[1]),
  };
}

const sha256 = (value) => createHash('sha256')
  .update(JSON.stringify(value))
  .digest('hex');

const runs = [renderOnce(), renderOnce()];
const hashes = runs.map(sha256);

const report = {
  deterministic: hashes[0] === hashes[1],
  runHashes: hashes,
  ...runs[0],
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));

if (!report.deterministic) {
  process.exitCode = 1;
}
