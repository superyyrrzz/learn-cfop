/**
 * Orchestrator for cube interaction.
 * Manages algorithm loading, playback (play/pause/step), and state sync.
 */

import { CubeModel } from './CubeModel.js';
import { CubeRenderer } from './CubeRenderer.js';
import { CubeAnimator } from './CubeAnimator.js';
import { MoveParser } from './MoveParser.js';

export class CubeController {
  constructor(container) {
    this.model = new CubeModel();
    this.renderer = new CubeRenderer(container);
    this.animator = new CubeAnimator(this.renderer);

    this.moves = [];        // Parsed moves for current algorithm
    this.setupMoves = [];   // Setup moves (applied before algorithm)
    this.currentStep = 0;   // Current position in the algorithm
    this.isPlaying = false;
    this._playAbort = false;

    this.onStepChange = null; // Callback: (currentStep, totalSteps) => {}
    this.onPlayStateChange = null; // Callback: (isPlaying) => {}

    // Initial render
    this.renderer.updateColors(this.model);
  }

  /**
   * Load an algorithm for playback.
   * @param {string} algorithm - Move notation e.g. "R U R' U'"
   * @param {string} [setupMoves] - Setup moves to apply first (cube starts in unsolved state)
   */
  loadAlgorithm(algorithm, setupMoves = '') {
    this.pause();
    this.animator.clearQueue();

    this.moves = MoveParser.parse(algorithm);
    this.setupMoves = setupMoves ? MoveParser.parse(setupMoves) : [];
    this.currentStep = 0;

    // Reset cube, apply setup moves (no animation)
    this.model.reset();
    if (this.setupMoves.length > 0) {
      this.model.applyMoves(this.setupMoves, false);
    }

    this.renderer.resetCubies();
    this.renderer.updateColors(this.model);
    this._notifyStep();
  }

  /**
   * Play through the algorithm from current position.
   */
  async play() {
    if (this.isPlaying) return;
    if (this.currentStep >= this.moves.length) {
      // At the end — reset and replay
      this.reset();
    }

    this.isPlaying = true;
    this._playAbort = false;
    this._notifyPlayState();

    while (this.currentStep < this.moves.length && !this._playAbort) {
      await this._executeStep(this.moves[this.currentStep]);
      this.currentStep++;
      this._notifyStep();
    }

    this.isPlaying = false;
    this._notifyPlayState();
  }

  /**
   * Pause playback.
   */
  pause() {
    this._playAbort = true;
    this.isPlaying = false;
    this._notifyPlayState();
  }

  /**
   * Toggle play/pause.
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Step forward one move.
   */
  async stepForward() {
    if (this.isPlaying || this.animator.isAnimating) return;
    if (this.currentStep >= this.moves.length) return;

    await this._executeStep(this.moves[this.currentStep]);
    this.currentStep++;
    this._notifyStep();
  }

  /**
   * Step backward one move.
   */
  async stepBackward() {
    if (this.isPlaying || this.animator.isAnimating) return;
    if (this.currentStep <= 0) return;

    this.currentStep--;
    const move = this.moves[this.currentStep];
    const inverse = move.inverse();

    this.model.applyMove(inverse, false);
    await this.animator.animateMove(inverse);
    this._notifyStep();
  }

  /**
   * Reset to initial state (setup applied, algorithm not started).
   */
  reset() {
    this.pause();
    this.animator.clearQueue();
    this.currentStep = 0;

    this.model.reset();
    if (this.setupMoves.length > 0) {
      this.model.applyMoves(this.setupMoves, false);
    }

    this.renderer.resetCubies();
    this.renderer.updateColors(this.model);
    this._notifyStep();
  }

  /**
   * Set playback speed multiplier.
   */
  setSpeed(speed) {
    this.animator.setSpeed(speed);
  }

  async _executeStep(move) {
    this.model.applyMove(move, false);
    await this.animator.animateMove(move);
    // Don't call updateColors here — the animation physically carries
    // sticker meshes to their correct positions with correct colors.
  }

  _notifyStep() {
    if (this.onStepChange) {
      this.onStepChange(this.currentStep, this.moves.length);
    }
  }

  _notifyPlayState() {
    if (this.onPlayStateChange) {
      this.onPlayStateChange(this.isPlaying);
    }
  }

  dispose() {
    this.pause();
    this.renderer.dispose();
  }
}
