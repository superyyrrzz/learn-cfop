/**
 * Creates SVG pattern diagrams for OLL/PLL recognition.
 * 3x3 grid where filled squares = yellow (oriented), empty = not oriented.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_SIZE = 12;
const GAP = 1;
const GRID_SIZE = CELL_SIZE * 3 + GAP * 4;

export class PatternDiagram {
  /**
   * Create an SVG element showing the top-face recognition pattern.
   * @param {number[]} pattern - 9-element array (1=yellow, 0=not)
   * @returns {SVGElement}
   */
  static create(pattern) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${GRID_SIZE} ${GRID_SIZE}`);
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.classList.add('pattern-svg');

    // Background
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', GRID_SIZE);
    bg.setAttribute('height', GRID_SIZE);
    bg.setAttribute('rx', '2');
    bg.setAttribute('fill', '#2d3250');
    svg.appendChild(bg);

    // Draw 3x3 grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const x = GAP + col * (CELL_SIZE + GAP);
        const y = GAP + row * (CELL_SIZE + GAP);

        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', CELL_SIZE);
        rect.setAttribute('height', CELL_SIZE);
        rect.setAttribute('rx', '1');

        if (pattern[idx]) {
          rect.setAttribute('fill', '#ffd500'); // Yellow
        } else {
          rect.setAttribute('fill', '#1a1d27'); // Dark (not oriented)
        }

        svg.appendChild(rect);
      }
    }

    return svg;
  }
}
