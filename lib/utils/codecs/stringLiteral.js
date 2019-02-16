const ui8aHelpers = require('../ui8aHelpers')
const { decodeInteger, encodeInteger } = require('./integer')

function decodeStringLiteral (ui8a, byteOffset = 0) {
  const decodedLength = decodeInteger(ui8a, 8, byteOffset)
  byteOffset = decodedLength.byteOffset + decodedLength.value
  return {
    isHuffmanEncoded: Boolean(decodedLength.firstBits),
    stringLiteral: ui8a.slice(decodedLength.byteOffset, byteOffset),
    byteOffset
  }
}
function encodeStringLiteral (isHuffmanEncoded, stringLiteral) {
  const byte = isHuffmanEncoded ? 0x80 : 0x00
  return ui8aHelpers.concat([encodeInteger(byte, 8, stringLiteral.length), stringLiteral])
}

exports.decodeStringLiteral = decodeStringLiteral
exports.encodeStringLiteral = encodeStringLiteral
