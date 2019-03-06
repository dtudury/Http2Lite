const { hpackStaticTable } = require('../../constants')
const { stringFromUi8a } = require('../ui8aHelpers')
const { decodeHeader, decodeHuffman } = require('../codecs')
const { INDEXED, INCREMENTAL, SIZE_UPDATE } = require('../../constants')
const HpackContext = require('./HpackContext')

/**
 * @typedef {Object} HeaderField
 * @property {string} name
 * @property {string} value
 */

module.exports = class HpackDecodingContext extends HpackContext {
  _combinedTable (index) {
    if (index <= hpackStaticTable.length) {
      return hpackStaticTable[index - 1]
    } else {
      return this._dynamicTable[index - hpackStaticTable.length - 1]
    }
  }

  /**
   * @param {Uint8Array} headerBlock - An ordered list of header field representations, which, when decoded, yields a complete header list.
   * @returns {Array.<HeaderField>}
   */
  decode (headerBlock) {
    const headerFields = []
    let byteOffset = 0
    while (byteOffset < headerBlock.length) {
      let name, value
      let headerField
      let header = decodeHeader(headerBlock, byteOffset)
      let kind = header.kind
      byteOffset = header.byteOffset
      if (kind === INDEXED) {
        [name, value] = this._combinedTable(header.index)
        headerField = { name, value, kind }
      } else if (kind === SIZE_UPDATE) {
        this.maximumTableSize = header.maxSize
        headerField = { maxSize: header.maxSize, kind }
      } else {
        if (header.index) {
          [name] = this._combinedTable(header.index)
        } else {
          name = decodeString(header.name)
        }
        value = decodeString(header.value)
        if (kind === INCREMENTAL) {
          this._addEntry(name, value)
        }
        headerField = { name, value, kind }
      }
      headerFields.push(headerField)
    }
    return headerFields
  }
}

function decodeString (encodedString) {
  if (encodedString.isHuffmanEncoded) {
    return stringFromUi8a(decodeHuffman(encodedString.stringLiteral))
  } else {
    return stringFromUi8a(encodedString.stringLiteral)
  }
}
