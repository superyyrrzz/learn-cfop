/**
 * Resolves highlight descriptors to [face, index] sticker positions.
 */

const SLOT_DEFINITIONS = {
  FR: {
    corner: [['D', 2], ['F', 8], ['R', 6]],
    edge:   [['F', 5], ['R', 3]],
  },
  FL: {
    corner: [['D', 0], ['L', 6], ['F', 6]],
    edge:   [['F', 3], ['L', 5]],
  },
  BR: {
    corner: [['D', 8], ['R', 8], ['B', 8]],
    edge:   [['B', 3], ['R', 5]],
  },
  BL: {
    corner: [['D', 6], ['B', 6], ['L', 8]],
    edge:   [['B', 5], ['L', 3]],
  },
};

export class PieceHighlighter {
  static resolve(highlight, model) {
    switch (highlight.type) {
      case 'edge':
      case 'corner': {
        const piece = model.findPiece(highlight.colors);
        if (!piece) return [];
        return piece.faces.map(([f, i]) => [f, i]);
      }

      case 'sticker': {
        if (highlight.face !== undefined && highlight.index !== undefined) {
          return [[highlight.face, highlight.index]];
        }
        if (highlight.colors && highlight.stickerColor) {
          const piece = model.findPiece(highlight.colors);
          if (!piece) return [];
          for (let j = 0; j < piece.faces.length; j++) {
            if (piece.colors[j] === highlight.stickerColor) {
              return [piece.faces[j]];
            }
          }
        }
        return [];
      }

      case 'face': {
        if (!highlight.face) return [];
        return Array.from({ length: 9 }, (_, i) => [highlight.face, i]);
      }

      case 'slot': {
        const def = SLOT_DEFINITIONS[highlight.slot];
        if (!def) return [];
        return [...def.corner, ...def.edge];
      }

      default:
        return [];
    }
  }
}
