/**
 * @typedef {Object} HeaderField
 * @property {string} name
 * @property {string} value
 */

module.exports = class HpackContext {
  constructor (maximumTableSize = 4096) {
    this._maximumTableSize = maximumTableSize
    this._tableSize = 0
    this._dynamicTable = []
  }

  /**
   * @type {Number}
   */
  get maximumTableSize () {
    return this._maximumTableSize
  }

  set maximumTableSize (maximumTableSize) {
    this._maximumTableSize = maximumTableSize
    this._evict()
  }

  _addEntry (name, value) {
    const entrySize = name.length + value.length + 32
    this._evict(entrySize)
    this._dynamicTable.unshift([name, value])
    this._tableSize += entrySize
  }

  _evict (extraSpace = 0) {
    const targetSize = Math.max(0, this._maximumTableSize - extraSpace)
    while (this._tableSize > targetSize) {
      let evictedEntry = this._dynamicTable.pop()
      this._tableSize -= (evictedEntry[0].length + evictedEntry[1].length + 32)
    }
  }
}
