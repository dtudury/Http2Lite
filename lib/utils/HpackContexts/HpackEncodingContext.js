const { hpackStaticTable } = require('../../constants')
const { concat, ui8aFromString } = require('../ui8aHelpers')
const { encodeHeader, encodeStringLiteral, encodeHuffman } = require('../codecs')
const { INDEXED, INCREMENTAL, SIZE_UPDATE } = require('../../constants')
const HpackContext = require('./HpackContext')

/**
 * @typedef {Object} HeaderField
 * @property {number} kind
 * @property {string} name
 * @property {string} value
 * @property {number} maxSize
 */

module.exports = class HpackEncodingContext extends HpackContext {
  /**
   * @private
   * @param {HeaderField} headerField
   * @returns {Uint8Array}
   */
  _encodeHeaderField (headerField) {
    let kind = headerField.kind
    if (kind == null) {
      kind = INCREMENTAL
    }
    let header
    if (kind === SIZE_UPDATE) {
      return encodeHeader(headerField.kind, headerField.maxSize)
    }
    let index = _findInTables(headerField.name, headerField.value, [hpackStaticTable, this._dynamicTable])
    if (index.indexed === 'both') {
      header = encodeHeader(INDEXED, index.index)
    } else {
      if (kind === INCREMENTAL) {
        this._addEntry(headerField.name, headerField.value)
      }
      if (index.indexed === 'name') {
        header = encodeHeader(kind, index.index, encodeString(headerField.value))
      } else {
        header = encodeHeader(kind, 0, encodeString(headerField.name), encodeString(headerField.value))
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
}

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
