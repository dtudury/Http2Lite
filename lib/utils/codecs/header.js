const ui8aHelpers = require('../ui8aHelpers')
const { INDEXED, INCREMENTAL, NOT_INDEXED, NEVER_INDEXED, SIZE_UPDATE } = require('../../constants')
const { decodeInteger, encodeInteger } = require('./integer')
const { decodeStringLiteral } = require('./stringLiteral')

function _decodeLiteralHeader (kind, decodedIndex, ui8a) {
  let byteOffset = decodedIndex.byteOffset
  let name
  if (!decodedIndex.value) {
    // new name case
    name = decodeStringLiteral(ui8a, byteOffset)
    byteOffset = name.byteOffset
  }
  const value = decodeStringLiteral(ui8a, byteOffset)
  return { kind, index: decodedIndex.value, name, value, byteOffset: value.byteOffset }
}

function _decodeSizeUpdate (ui8a, byteOffset) {
  let decodedMaxSize = decodeInteger(ui8a, 3, byteOffset)
  return { kind: SIZE_UPDATE, maxSize: decodedMaxSize.value, byteOffset: decodedMaxSize.byteOffset }
}

function _decodeIndexed (ui8a, byteOffset) {
  let decodedIndex = decodeInteger(ui8a, 1, byteOffset)
  return { kind: INDEXED, index: decodedIndex.value, byteOffset: decodedIndex.byteOffset }
}

function decodeHeader (ui8a, byteOffset = 0) {
  const firstByte = ui8aHelpers.readUInt8(ui8a, byteOffset)
  let header
  if (firstByte & NEVER_INDEXED) {
    header = _decodeLiteralHeader(NEVER_INDEXED, decodeInteger(ui8a, 4, byteOffset), ui8a)
  } else if (firstByte & SIZE_UPDATE) {
    header = _decodeSizeUpdate(ui8a, byteOffset)
  } else if (firstByte & INCREMENTAL) {
    header = _decodeLiteralHeader(INCREMENTAL, decodeInteger(ui8a, 2, byteOffset), ui8a)
  } else if (firstByte & INDEXED) {
    header = _decodeIndexed(ui8a, byteOffset)
  } else {
    header = _decodeLiteralHeader(NOT_INDEXED, decodeInteger(ui8a, 4, byteOffset), ui8a)
  }
  return header
}
function encodeHeader (kind, index, name, value) {
  if (index) {
    // index holds (indexed) name. name holds value
    value = new Uint8Array([])
  }
  let encodedHeader
  if (kind === INDEXED) {
    encodedHeader = encodeInteger(INDEXED, 1, index)
  } else if (kind === INCREMENTAL) {
    encodedHeader = ui8aHelpers.concat([encodeInteger(INCREMENTAL, 2, index), name, value])
  } else if (kind === SIZE_UPDATE) {
    encodedHeader = encodeInteger(SIZE_UPDATE, 3, index)
  } else if (kind === NEVER_INDEXED) {
    encodedHeader = ui8aHelpers.concat([encodeInteger(NEVER_INDEXED, 4, index), name, value])
  } else if (kind === NOT_INDEXED) {
    encodedHeader = ui8aHelpers.concat([encodeInteger(NOT_INDEXED, 4, index), name, value])
  } else {
    throw new Error(`unknown header kind: ${kind}`)
  }
  return encodedHeader
}

exports.decodeHeader = decodeHeader
exports.encodeHeader = encodeHeader
