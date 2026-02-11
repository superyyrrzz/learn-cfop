/**
 * Animates face rotations on the 3D cube.
 * Uses temp THREE.Group reparenting to rotate 9 cubies at once.
 */

import * as THREE from 'three';

const EASE_OUT_CUBIC = t => 1 - Math.pow(1 - t, 3);

export class CubeAnimator {
  constructor(renderer) {
    this.renderer = renderer;
    this.isAnimating = false;
    this._queue = [];
    this._currentResolve = null;
    this.duration = 300; // ms per move
  }

  setSpeed(speed) {
    // speed: 0.5 = slow, 1 = normal, 2 = fast
    this.duration = 300 / speed;
  }

  /**
   * Animate a single move. Returns a promise that resolves when done.
   * move: Move object from MoveParser
   */
  animateMove(move) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        this._queue.push({ move, resolve });
        return;
      }
      this._startAnimation(move, resolve);
    });
  }

  _startAnimation(move, resolve) {
    this.isAnimating = true;
    this._currentResolve = resolve;

    const { axis, layer, direction, angle, double: isDouble, wide } = move;

    // Get cubies in this layer (and middle layer for wide moves)
    let layerCubies = this.renderer.getCubiesInLayer(axis, layer);
    if (wide) {
      const middleCubies = this.renderer.getCubiesInLayer(axis, 0);
      layerCubies = layerCubies.concat(middleCubies);
    }

    // Create temp group at scene origin
    const tempGroup = new THREE.Group();
    this.renderer.scene.add(tempGroup);

    // Reparent cubies into temp group (preserve world transform)
    for (const cubie of layerCubies) {
      tempGroup.attach(cubie.mesh);
    }

    // Target rotation
    const targetAngle = direction * angle;
    const rotationAxis = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    );

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / this.duration, 1);
      const eased = EASE_OUT_CUBIC(t);

      // Set rotation
      const currentAngle = targetAngle * eased;
      tempGroup.setRotationFromAxisAngle(rotationAxis, currentAngle);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete — reparent back to scene
        tempGroup.setRotationFromAxisAngle(rotationAxis, targetAngle);
        tempGroup.updateMatrixWorld();

        for (const cubie of layerCubies) {
          this.renderer.scene.attach(cubie.mesh);
          // Snap positions to avoid float drift
          cubie.mesh.position.x = Math.round(cubie.mesh.position.x);
          cubie.mesh.position.y = Math.round(cubie.mesh.position.y);
          cubie.mesh.position.z = Math.round(cubie.mesh.position.z);
          // Update logical position
          cubie.x = Math.round(cubie.mesh.position.x);
          cubie.y = Math.round(cubie.mesh.position.y);
          cubie.z = Math.round(cubie.mesh.position.z);
        }

        this.renderer.scene.remove(tempGroup);

        this.isAnimating = false;
        resolve();

        // Process queue
        if (this._queue.length > 0) {
          const next = this._queue.shift();
          this._startAnimation(next.move, next.resolve);
        }
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Skip current animation to completion immediately.
   */
  skipCurrent() {
    // Not implemented for simplicity; the animations are fast enough
  }

  clearQueue() {
    this._queue = [];
  }
}
