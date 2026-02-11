/**
 * Tracks user progress via localStorage.
 * Stores which algorithm IDs have been marked as "learned."
 */

const STORAGE_KEY = 'learn-cfop-progress';

export class ProgressTracker {
  static _getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  static _saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static isCompleted(id) {
    return !!this._getAll()[id];
  }

  static setCompleted(id, done) {
    const data = this._getAll();
    if (done) {
      data[id] = true;
    } else {
      delete data[id];
    }
    this._saveAll(data);
  }

  /**
   * Count how many of the given IDs are completed.
   */
  static countCompleted(ids) {
    const data = this._getAll();
    return ids.filter(id => data[id]).length;
  }

  /**
   * Get progress fraction for a list of algorithm IDs.
   */
  static getProgress(ids) {
    if (ids.length === 0) return 0;
    return this.countCompleted(ids) / ids.length;
  }
}
