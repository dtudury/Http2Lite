const { hpackStaticTable } = require('../constants')
const { concat } = require('../utils/ui8aHelpers')

/**
 * @typedef {Object} HeaderField
 * @property {string} name
 * @property {string} value
 */

// String.fromCharCode.apply(null, ui8a)

function _findInTables (name, value, tables) {
  let offset = 1
  let nameMatch
  for (let i = 0; i < tables.length; i++) {
    let table = tables[i]
    for (let j = 0; j < table.length; j++) {
      let row = table[j]
      if (row[0] === name) {
        if (row[1] === value) {
          return { indexed: 'both', index: j + offset }
        }
        if (nameMatch == null) {
          nameMatch = j + offset
        }
      }
    }
    offset += table.length
  }
  if (nameMatch != null) {
    return { indexed: 'name', i: nameMatch }
  } else {
    return null
  }
}

module.exports = class HpackContext {
  constructor (tableSize = 4096) {
    this._tableSize = tableSize
    this._dynamicTable = []
  }

  /**
   * @private
   * @param {HeaderField} headerField
   * @returns {Uint8Array}
   */
  _encodeHeaderField (headerField) {
    console.log(headerField)
    let index = _findInTables(headerField.name, headerField.value, [hpackStaticTable, this._dynamicTable])
    if (index.indexed === 'both') {
    }
    console.log(index)
    console.log(this._dynamicTable)
    return new Uint8Array()
  }

  /**
   * @param {Array.<HeaderField>} headerFieldList
   * @returns {Uint8Array}
   */
  encode (headerFieldList) {
    return concat(headerFieldList.map(this._encodeHeaderField.bind(this)))
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
