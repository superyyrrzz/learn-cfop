/**
 * Three.js renderer for the Rubik's cube.
 * Creates 26 cubies with colored sticker planes, OrbitControls for interaction.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CUBIE_SIZE = 0.95;
const GAP = 1.0; // Center-to-center distance between cubies
const STICKER_OFFSET = 0.501; // Slight offset from cubie face
const CORNER_RADIUS = 0.05;

// Map face names to sticker colors (hex)
const COLOR_HEX = {
  white:  0xffffff,
  yellow: 0xffd500,
  green:  0x009b48,
  blue:   0x0045ad,
  red:    0xb90000,
  orange: 0xff5900,
};

const DARK_PLASTIC = 0x1a1a1a;

export class CubeRenderer {
  constructor(container) {
    this.container = container;
    this.cubies = []; // { mesh, x, y, z } for each cubie
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationId = null;

    this._init();
  }

  _init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    this.camera.position.set(4.5, 3.5, 4.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;

    // Build cubies
    this._buildCubies();

    // Handle resize
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    // Start render loop
    this._animate();
  }

  _buildCubies() {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // Skip center

          const cubie = this._createCubie(x, y, z);
          cubie.position.set(x * GAP, y * GAP, z * GAP);
          this.scene.add(cubie);
          this.cubies.push({
            mesh: cubie,
            x, y, z,
            // Store base position for layer detection
            baseX: x, baseY: y, baseZ: z,
          });
        }
      }
    }
  }

  _createCubie(x, y, z) {
    const group = new THREE.Group();

    // Black body
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const material = new THREE.MeshLambertMaterial({ color: DARK_PLASTIC });
    const body = new THREE.Mesh(geometry, material);
    group.add(body);

    // Add stickers on outer faces
    const stickerSize = CUBIE_SIZE * 0.85;
    const stickerGeo = new THREE.PlaneGeometry(stickerSize, stickerSize);

    // Right face (x = 1)
    if (x === 1) this._addSticker(group, stickerGeo, 'placeholder', [STICKER_OFFSET, 0, 0], [0, Math.PI / 2, 0]);
    // Left face (x = -1)
    if (x === -1) this._addSticker(group, stickerGeo, 'placeholder', [-STICKER_OFFSET, 0, 0], [0, -Math.PI / 2, 0]);
    // Up face (y = 1)
    if (y === 1) this._addSticker(group, stickerGeo, 'placeholder', [0, STICKER_OFFSET, 0], [-Math.PI / 2, 0, 0]);
    // Down face (y = -1)
    if (y === -1) this._addSticker(group, stickerGeo, 'placeholder', [0, -STICKER_OFFSET, 0], [Math.PI / 2, 0, 0]);
    // Front face (z = 1)
    if (z === 1) this._addSticker(group, stickerGeo, 'placeholder', [0, 0, STICKER_OFFSET], [0, 0, 0]);
    // Back face (z = -1)
    if (z === -1) this._addSticker(group, stickerGeo, 'placeholder', [0, 0, -STICKER_OFFSET], [0, Math.PI, 0]);

    return group;
  }

  _addSticker(group, geometry, colorKey, position, rotation) {
    const material = new THREE.MeshLambertMaterial({
      color: 0x888888, // Placeholder, updated by updateColors
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.userData.isSticker = true;
    group.add(mesh);
  }

  /**
   * Reset all cubie meshes to their initial (solved) positions and rotations.
   * Must be called before updateColors() whenever cubies may have accumulated
   * rotations from prior animations (e.g. in loadAlgorithm/reset).
   */
  resetCubies() {
    for (const cubie of this.cubies) {
      cubie.mesh.position.set(
        cubie.baseX * GAP,
        cubie.baseY * GAP,
        cubie.baseZ * GAP
      );
      cubie.mesh.rotation.set(0, 0, 0);
      cubie.x = cubie.baseX;
      cubie.y = cubie.baseY;
      cubie.z = cubie.baseZ;
    }
  }

  highlightFace(faceName) {
    this.clearHighlight();
    const faceConfig = {
      U: { pos: [0, 1.51, 0], rot: [-Math.PI / 2, 0, 0] },
      D: { pos: [0, -1.51, 0], rot: [Math.PI / 2, 0, 0] },
      F: { pos: [0, 0, 1.51], rot: [0, 0, 0] },
      B: { pos: [0, 0, -1.51], rot: [0, Math.PI, 0] },
      R: { pos: [1.51, 0, 0], rot: [0, Math.PI / 2, 0] },
      L: { pos: [-1.51, 0, 0], rot: [0, -Math.PI / 2, 0] },
    };
    const cfg = faceConfig[faceName];
    if (!cfg) return;
    const geo = new THREE.PlaneGeometry(3.1, 3.1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6366f1, opacity: 0.3, transparent: true,
      side: THREE.DoubleSide, depthTest: false,
    });
    this._highlightMesh = new THREE.Mesh(geo, mat);
    this._highlightMesh.position.set(...cfg.pos);
    this._highlightMesh.rotation.set(...cfg.rot);
    this._highlightMesh.renderOrder = 999;
    this.scene.add(this._highlightMesh);
  }

  clearHighlight() {
    if (this._highlightMesh) {
      this.scene.remove(this._highlightMesh);
      this._highlightMesh.geometry.dispose();
      this._highlightMesh.material.dispose();
      this._highlightMesh = null;
    }
  }

  /**
   * Update sticker colors from CubeModel state.
   * Maps 3D cubie positions to model face/index.
   */
  updateColors(cubeModel) {
    for (const cubie of this.cubies) {
      const { mesh, x, y, z } = cubie;
      const stickers = mesh.children.filter(c => c.userData.isSticker);

      for (const sticker of stickers) {
        // Compute the sticker's world-space normal to determine which face it's on.
        // The sticker plane's local normal is (0,0,1). We transform it through
        // both the sticker's local rotation AND the parent cubie group's rotation
        // to get the actual world-facing direction.
        const normal = new THREE.Vector3(0, 0, 1);
        sticker.updateWorldMatrix(true, false);
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(sticker.matrixWorld);
        normal.applyMatrix3(normalMatrix).normalize();

        const nx = Math.round(normal.x);
        const ny = Math.round(normal.y);
        const nz = Math.round(normal.z);

        let faceName, index;

        if (nx === 1) {
          faceName = 'R';
          index = this._posToIndex('R', x, y, z);
        } else if (nx === -1) {
          faceName = 'L';
          index = this._posToIndex('L', x, y, z);
        } else if (ny === 1) {
          faceName = 'U';
          index = this._posToIndex('U', x, y, z);
        } else if (ny === -1) {
          faceName = 'D';
          index = this._posToIndex('D', x, y, z);
        } else if (nz === 1) {
          faceName = 'F';
          index = this._posToIndex('F', x, y, z);
        } else if (nz === -1) {
          faceName = 'B';
          index = this._posToIndex('B', x, y, z);
        }

        if (faceName !== undefined && index !== undefined) {
          const colorName = cubeModel.getFaceColor(faceName, index);
          sticker.material.color.setHex(COLOR_HEX[colorName]);
        }
      }
    }
  }

  /**
   * Map 3D position to face sticker index.
   * Face sticker layout (looking at face):
   *   0 1 2
   *   3 4 5
   *   6 7 8
   */
  _posToIndex(face, x, y, z) {
    switch (face) {
      case 'U': // y=1, looking down: x goes right, z goes away (top of cube)
        return (1 - z) * 3 + (x + 1);
      case 'D': // y=-1, looking up: x goes right, z goes toward
        return (z + 1) * 3 + (x + 1);
      case 'F': // z=1, looking at it: x goes right, y goes down
        return (1 - y) * 3 + (x + 1);
      case 'B': // z=-1, looking at it: x goes left, y goes down
        return (1 - y) * 3 + (1 - x);
      case 'R': // x=1, looking at it: z goes left, y goes down
        return (1 - y) * 3 + (1 - z);
      case 'L': // x=-1, looking at it: z goes right, y goes down
        return (1 - y) * 3 + (z + 1);
      default:
        return 0;
    }
  }

  /**
   * Get cubies in a specific layer for animation.
   * axis: 'x', 'y', or 'z'
   * layer: -1, 0, or 1
   */
  getCubiesInLayer(axis, layer) {
    return this.cubies.filter(c => {
      const pos = c.mesh.position;
      const val = Math.round(pos[axis]);
      return val === layer;
    });
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this._onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
