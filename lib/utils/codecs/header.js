const ui8aHelpers = require('../ui8aHelpers')
const { INDEXED, INCREMENTAL, NOT_INDEXED, NEVER_INDEXED, SIZE_UPDATE } = require('../../constants')
const { decodeInteger, encodeInteger } = require('./integer')
const { decodeStringLiteral } = require('./stringLiteral')

function _decodeHeaderHelper (kind, decodedIndex, ui8a) {
  let byteOffset = decodedIndex.byteOffset
  let name
  if (!decodedIndex.value) {
    name = decodeStringLiteral(ui8a, byteOffset)
    byteOffset = name.byteOffset
  }
  const value = decodeStringLiteral(ui8a, byteOffset)
  return { kind, index: decodedIndex.value, name, value, byteOffset: value.byteOffset }
}

function decodeHeader (ui8a, byteOffset = 0) {
  const firstByte = ui8aHelpers.readUInt8(ui8a, byteOffset)
  let decodedIndex
  if (firstByte & NEVER_INDEXED) {
    return _decodeHeaderHelper(NEVER_INDEXED, decodeInteger(ui8a, 4, byteOffset), ui8a)
  } else if (firstByte & SIZE_UPDATE) {
    decodedIndex = decodeInteger(ui8a, 3, byteOffset)
    return { kind: SIZE_UPDATE, maxSize: decodedIndex.value, byteOffset: decodedIndex.byteOffset }
  } else if (firstByte & INCREMENTAL) {
    return _decodeHeaderHelper(INCREMENTAL, decodeInteger(ui8a, 2, byteOffset), ui8a)
  } else if (firstByte & INDEXED) {
    decodedIndex = decodeInteger(ui8a, 1, byteOffset)
    return { kind: INDEXED, index: decodedIndex.value, byteOffset: decodedIndex.byteOffset }
  } else {
    return _decodeHeaderHelper(NOT_INDEXED, decodeInteger(ui8a, 4, byteOffset), ui8a)
  }
}
function encodeHeader (kind, index, name, value) {
  if (index) {
    // index holds (indexed) name. name holds value
    value = new Uint8Array([])
  }
  if (kind === INDEXED) {
    return encodeInteger(INDEXED, 1, index)
  } else if (kind === INCREMENTAL) {
    return ui8aHelpers.concat([encodeInteger(INCREMENTAL, 2, index), name, value])
  } else if (kind === SIZE_UPDATE) {
    return encodeInteger(SIZE_UPDATE, 3, index)
  } else if (kind === NEVER_INDEXED) {
    return ui8aHelpers.concat([encodeInteger(NEVER_INDEXED, 4, index), name, value])
  } else if (kind === NOT_INDEXED) {
    return ui8aHelpers.concat([encodeInteger(NOT_INDEXED, 4, index), name, value])
  } else {
    throw new Error(`unknown header kind: ${kind}`)
  }
}

exports.decodeHeader = decodeHeader
exports.encodeHeader = encodeHeader
