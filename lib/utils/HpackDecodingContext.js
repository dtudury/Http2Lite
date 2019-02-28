/**
 * @typedef {Object} HeaderField
 * @property {Uint8Array} name
 * @property {Uint8Array} value
 */

// String.fromCharCode.apply(null, ui8a)

module.exports = class HpackContext {
  constructor (tableSize = 4096) {
    this._tableSize = tableSize
    this._dynamicTable = {}
  }

  /**
   * @param {Uint8Array} headerBlock - An ordered list of header field representations, which, when decoded, yields a complete header list.
   * @returns {Array.<HeaderField>}
   */
  decode (headerBlock) {
    // need to make header decoders throw
  }

  /**
   * @type {Number}
   */
  get tableSize () {
    return this._tableSize
  }

  set tableSize (tableSize) {
    this._tableSize = tableSize
    this._evict()
  }

  _evict () {
  }
}
