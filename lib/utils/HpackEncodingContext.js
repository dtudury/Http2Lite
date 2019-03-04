const { hpackStaticTable } = require('../constants')
const { concat, ui8aFromString } = require('../utils/ui8aHelpers')
const { encodeHeader, encodeStringLiteral, encodeHuffman } = require('../utils/codecs')
const { INDEXED, INCREMENTAL } = require('../constants')

/**
 * @typedef {Object} HeaderField
 * @property {string} name
 * @property {string} value
 */

function _findInTables (name, value, tables) {
  let tableOffset = 1
  let nameMatch
  for (let i = 0; i < tables.length; i++) {
    let table = tables[i]
    for (let j = 0; j < table.length; j++) {
      let row = table[j]
      if (row[0] === name) {
        if (row[1] === value) {
          return { indexed: 'both', index: j + tableOffset }
        }
        if (nameMatch == null) {
          nameMatch = j + tableOffset
        }
      }
    }
    tableOffset += table.length
  }
  if (nameMatch != null) {
    return { indexed: 'name', index: nameMatch }
  } else {
    return { indexed: 'none' }
  }
}

function encodeString (string) {
  let ui8a = ui8aFromString(string)
  let huffmanEncoded = encodeHuffman(ui8a)
  if (huffmanEncoded.length < ui8a.length) {
    return encodeStringLiteral(true, huffmanEncoded)
  } else {
    return encodeStringLiteral(false, ui8a)
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
    let index = _findInTables(headerField.name, headerField.value, [hpackStaticTable, this._dynamicTable])
    let header
    if (index.indexed === 'both') {
      header = encodeHeader(INDEXED, index.index)
    } else {
      this._addEntry(headerField.name, headerField.value)
      if (index.indexed === 'name') {
        header = encodeHeader(INCREMENTAL, index.index, encodeString(headerField.value))
      } else {
        header = encodeHeader(INCREMENTAL, 0, encodeString(headerField.name), encodeString(headerField.value))
      }
    }
    return header
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

  _addEntry (name, value) {
    this._evict(/* some size */)
    this._dynamicTable.unshift([name, value])
  }

  _evict () {
  }
}
