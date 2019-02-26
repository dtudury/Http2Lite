/**
 * @typedef {Object} KeyValuePair
 * @property {name}
 * @property {value}
 */

module.exports = class HpackContext {
  constructor (tableSize = 4096) {
    this.tableSize = tableSize
    this.dynamicTable = {}
  }

  /**
   * @param {KeyValuePair} kvp
   */
  encode (kvp) {

  }

  /**
   * @param {Uint8Array} hfr - header field representation
   * @returns {KeyValuePair}
   */
  decode (hfr) {

  }
}
