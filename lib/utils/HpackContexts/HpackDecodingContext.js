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
  constructor (maximumTableSize = 4096) {
    super(maximumTableSize)
  }

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
      let header = decodeHeader(headerBlock, byteOffset)
      byteOffset = header.byteOffset
      if (header.kind === INDEXED) {
        [name, value] = this._combinedTable(header.index)
      } else if (header.kind === SIZE_UPDATE) {
        this.maximumTableSize = header.maxSize
      } else if (header.kind === INCREMENTAL) {
        if (header.index) {
          [name] = this._combinedTable(header.index)
        } else {
          name = decodeString(header.name)
        }
        value = decodeString(header.value)
        this._addEntry(name, value)
      } else {
        throw new Error('unhandled kind of header', headerBlock)
      }
      headerFields.push({ name, value })
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
