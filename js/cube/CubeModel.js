/**
 * Rubik's Cube state model.
 * 6 faces x 9 stickers, with permutation tables for each move.
 * Face indices: 0=U, 1=D, 2=F, 3=B, 4=R, 5=L
 * Sticker indices per face (looking at face):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */

// Standard Rubik's cube colors
const COLORS = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
};

const FACE_NAMES = ['U', 'D', 'F', 'B', 'R', 'L'];

export class CubeModel {
  constructor() {
    this.history = [];
    this.reset();
  }

  reset() {
    // Each face is an array of 9 color values
    this.faces = {};
    for (const name of FACE_NAMES) {
      this.faces[name] = Array(9).fill(COLORS[name]);
    }
    this.history = [];
  }

  clone() {
    const copy = new CubeModel();
    for (const name of FACE_NAMES) {
      copy.faces[name] = [...this.faces[name]];
    }
    return copy;
  }

  /**
   * Rotate a face's stickers 90 degrees clockwise (looking at face).
   */
  _rotateFaceCW(faceName) {
    const f = this.faces[faceName];
    const temp = [...f];
    // CW rotation mapping
    f[0] = temp[6]; f[1] = temp[3]; f[2] = temp[0];
    f[3] = temp[7]; f[4] = temp[4]; f[5] = temp[1];
    f[6] = temp[8]; f[7] = temp[5]; f[8] = temp[2];
  }

  _rotateFaceCCW(faceName) {
    const f = this.faces[faceName];
    const temp = [...f];
    f[0] = temp[2]; f[1] = temp[5]; f[2] = temp[8];
    f[3] = temp[1]; f[4] = temp[4]; f[5] = temp[7];
    f[6] = temp[0]; f[7] = temp[3]; f[8] = temp[6];
  }

  _rotateFace180(faceName) {
    const f = this.faces[faceName];
    const temp = [...f];
    f[0] = temp[8]; f[1] = temp[7]; f[2] = temp[6];
    f[3] = temp[5]; f[4] = temp[4]; f[5] = temp[3];
    f[6] = temp[2]; f[7] = temp[1]; f[8] = temp[0];
  }

  /**
   * Cycle 4 arrays of sticker values (each array = positions to cycle).
   */
  _cycle4(strips) {
    // strips: [a, b, c, d] — cycle a->b->c->d->a
    const temp = strips[3].map(([face, idx]) => this.faces[face][idx]);
    for (let i = 3; i > 0; i--) {
      for (let j = 0; j < strips[i].length; j++) {
        const [df, di] = strips[i][j];
        const [sf, si] = strips[i - 1][j];
        this.faces[df][di] = this.faces[sf][si];
      }
    }
    for (let j = 0; j < strips[0].length; j++) {
      const [f, idx] = strips[0][j];
      this.faces[f][idx] = temp[j];
    }
  }

  /**
   * Apply a move (Move object from MoveParser).
   */
  applyMove(move, recordHistory = true) {
    if (recordHistory) {
      this.history.push(move);
    }

    const face = move.face;

    if (move.double) {
      this._rotateFace180(face);
      this._applyEdgeCycle(face, 2);
      if (move.wide) this._applyMiddleCycle(face, 2);
    } else if (!move.prime) {
      this._rotateFaceCW(face);
      this._applyEdgeCycle(face, 1);
      if (move.wide) this._applyMiddleCycle(face, 1);
    } else {
      this._rotateFaceCCW(face);
      this._applyEdgeCycle(face, 3);
      if (move.wide) this._applyMiddleCycle(face, 3);
    }
  }

  _applyEdgeCycle(face, times) {
    const cycles = EDGE_CYCLES[face];
    for (let t = 0; t < times; t++) {
      this._cycle4(cycles);
    }
  }

  _applyMiddleCycle(face, times) {
    const cycles = MIDDLE_CYCLES[face];
    if (!cycles) return;
    for (let t = 0; t < times; t++) {
      this._cycle4(cycles);
    }
  }

  /**
   * Apply a sequence of moves.
   */
  applyMoves(moves, recordHistory = true) {
    for (const move of moves) {
      this.applyMove(move, recordHistory);
    }
  }

  /**
   * Undo last move.
   */
  undo() {
    if (this.history.length === 0) return null;
    const move = this.history.pop();
    const inv = move.inverse();
    this.applyMove(inv, false);
    return move;
  }

  isSolved() {
    for (const name of FACE_NAMES) {
      const f = this.faces[name];
      if (!f.every(c => c === f[0])) return false;
    }
    return true;
  }

  getFaceColor(faceName, index) {
    return this.faces[faceName][index];
  }
}

// Edge cycle definitions for each face move (CW direction).
// Each entry: 4 strips of 3 [face, index] pairs to cycle.
// Indices match the renderer's _posToIndex convention.
const EDGE_CYCLES = {
  R: [
    [['F', 2], ['F', 5], ['F', 8]],
    [['U', 8], ['U', 5], ['U', 2]],
    [['B', 6], ['B', 3], ['B', 0]],
    [['D', 8], ['D', 5], ['D', 2]],
  ],
  L: [
    [['F', 0], ['F', 3], ['F', 6]],
    [['D', 6], ['D', 3], ['D', 0]],
    [['B', 8], ['B', 5], ['B', 2]],
    [['U', 6], ['U', 3], ['U', 0]],
  ],
  U: [
    [['F', 0], ['F', 1], ['F', 2]],
    [['L', 0], ['L', 1], ['L', 2]],
    [['B', 0], ['B', 1], ['B', 2]],
    [['R', 0], ['R', 1], ['R', 2]],
  ],
  D: [
    [['F', 6], ['F', 7], ['F', 8]],
    [['R', 6], ['R', 7], ['R', 8]],
    [['B', 6], ['B', 7], ['B', 8]],
    [['L', 6], ['L', 7], ['L', 8]],
  ],
  F: [
    [['U', 0], ['U', 1], ['U', 2]],
    [['R', 0], ['R', 3], ['R', 6]],
    [['D', 8], ['D', 7], ['D', 6]],
    [['L', 8], ['L', 5], ['L', 2]],
  ],
  B: [
    [['U', 6], ['U', 7], ['U', 8]],
    [['L', 6], ['L', 3], ['L', 0]],
    [['D', 2], ['D', 1], ['D', 0]],
    [['R', 2], ['R', 5], ['R', 8]],
  ],
};

// Middle slice cycles for wide moves (same direction as the face move).
// Wide R (r) = R face rotation + middle slice (x=0) rotating in same direction.
// Indices match the renderer's _posToIndex convention.
const MIDDLE_CYCLES = {
  R: [
    [['D', 1], ['D', 4], ['D', 7]],
    [['F', 7], ['F', 4], ['F', 1]],
    [['U', 1], ['U', 4], ['U', 7]],
    [['B', 1], ['B', 4], ['B', 7]],
  ],
  L: [
    [['D', 1], ['D', 4], ['D', 7]],
    [['B', 1], ['B', 4], ['B', 7]],
    [['U', 1], ['U', 4], ['U', 7]],
    [['F', 7], ['F', 4], ['F', 1]],
  ],
  U: [
    [['L', 3], ['L', 4], ['L', 5]],
    [['B', 3], ['B', 4], ['B', 5]],
    [['R', 3], ['R', 4], ['R', 5]],
    [['F', 3], ['F', 4], ['F', 5]],
  ],
  D: [
    [['L', 3], ['L', 4], ['L', 5]],
    [['F', 3], ['F', 4], ['F', 5]],
    [['R', 3], ['R', 4], ['R', 5]],
    [['B', 3], ['B', 4], ['B', 5]],
  ],
  F: [
    [['L', 1], ['L', 4], ['L', 7]],
    [['U', 5], ['U', 4], ['U', 3]],
    [['R', 7], ['R', 4], ['R', 1]],
    [['D', 3], ['D', 4], ['D', 5]],
  ],
  B: [
    [['L', 1], ['L', 4], ['L', 7]],
    [['D', 3], ['D', 4], ['D', 5]],
    [['R', 7], ['R', 4], ['R', 1]],
    [['U', 5], ['U', 4], ['U', 3]],
  ],
};
