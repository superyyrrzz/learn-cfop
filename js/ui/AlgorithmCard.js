/**
 * Expandable algorithm card with embedded 3D cube demo.
 * Lazy-initializes Three.js renderer only when expanded.
 */

import { CubeController } from '../cube/CubeController.js';
import { MoveParser } from '../cube/MoveParser.js';
import { PatternDiagram } from './PatternDiagram.js';
import { PlayerControls } from './PlayerControls.js';
import { ProgressTracker } from './ProgressTracker.js';

export class AlgorithmCard {
  constructor(data, listEl, onToggle) {
    this.data = data;
    this.listEl = listEl;
    this.onToggle = onToggle; // callback when expanded
    this.controller = null;
    this.expanded = false;
    this.el = null;
    this._build();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'alg-card';

    // Header
    const header = document.createElement('div');
    header.className = 'alg-card__header';
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking the checkbox
      if (e.target.closest('.alg-card__check')) return;
      this.toggle();
    });

    // Pattern thumbnail
    const patternWrap = document.createElement('div');
    patternWrap.className = 'alg-card__pattern';
    if (this.data.recognition && this.data.recognition.topPattern) {
      patternWrap.appendChild(PatternDiagram.create(this.data.recognition.topPattern));
    }

    // Info
    const info = document.createElement('div');
    info.className = 'alg-card__info';
    const name = document.createElement('div');
    name.className = 'alg-card__name';
    name.textContent = this.data.name;
    const algText = document.createElement('div');
    algText.className = 'alg-card__alg-text';
    algText.textContent = this.data.algorithm;
    info.appendChild(name);
    info.appendChild(algText);

    // Checkbox
    const check = document.createElement('div');
    check.className = 'alg-card__check';
    if (ProgressTracker.isCompleted(this.data.id)) {
      check.classList.add('alg-card__check--done');
    }
    check.addEventListener('click', (e) => {
      e.stopPropagation();
      const done = check.classList.toggle('alg-card__check--done');
      ProgressTracker.setCompleted(this.data.id, done);
      // Dispatch event for progress bar updates
      window.dispatchEvent(new Event('progress-changed'));
    });

    // Expand icon
    const expandIcon = document.createElement('span');
    expandIcon.className = 'alg-card__expand-icon';
    expandIcon.textContent = '▼';

    header.appendChild(patternWrap);
    header.appendChild(info);
    header.appendChild(check);
    header.appendChild(expandIcon);

    // Body (hidden until expanded)
    this.body = document.createElement('div');
    this.body.className = 'alg-card__body';

    this.el.appendChild(header);
    this.el.appendChild(this.body);
    this.listEl.appendChild(this.el);
  }

  toggle() {
    if (this.expanded) {
      this.collapse();
    } else {
      if (this.onToggle) this.onToggle(this);
      this.expand();
    }
  }

  expand() {
    this.expanded = true;
    this.el.classList.add('alg-card--expanded');
    this._initBody();
  }

  collapse() {
    this.expanded = false;
    this.el.classList.remove('alg-card--expanded');
    if (this.controller) {
      this.controller.pause();
    }
  }

  _initBody() {
    if (this.controller) {
      // Already initialized, just reset
      this.controller.reset();
      return;
    }

    this.body.innerHTML = '';

    // Description
    if (this.data.description) {
      const desc = document.createElement('p');
      desc.className = 'alg-card__description';
      desc.textContent = this.data.description;
      this.body.appendChild(desc);
    }

    // Cube viewer
    const viewerEl = document.createElement('div');
    viewerEl.className = 'cube-viewer';
    this.body.appendChild(viewerEl);

    // Algorithm display with per-move spans
    const algDisplay = document.createElement('div');
    algDisplay.className = 'alg-display';
    const moves = MoveParser.parse(this.data.algorithm);
    this.moveSpans = moves.map((m, i) => {
      const span = document.createElement('span');
      span.className = 'alg-display__move';
      span.textContent = m.toString();
      algDisplay.appendChild(span);
      if (i < moves.length - 1) {
        algDisplay.appendChild(document.createTextNode(' '));
      }
      return span;
    });
    this.body.appendChild(algDisplay);

    // Init controller
    this.controller = new CubeController(viewerEl);
    this.controller.loadAlgorithm(this.data.algorithm, this.data.setupMoves || '');

    // Highlight current move
    this.controller.onStepChange = (current, total) => {
      this.moveSpans.forEach((span, i) => {
        span.classList.remove('alg-display__move--active', 'alg-display__move--done');
        if (i < current) {
          span.classList.add('alg-display__move--done');
        } else if (i === current) {
          span.classList.add('alg-display__move--active');
        }
      });
    };

    // Player controls
    const controlsWrap = document.createElement('div');
    this.body.appendChild(controlsWrap);
    new PlayerControls(controlsWrap, this.controller);
  }

  dispose() {
    if (this.controller) {
      this.controller.dispose();
      this.controller = null;
    }
  }
}
