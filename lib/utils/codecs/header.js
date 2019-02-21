const ui8aHelpers = require('../ui8aHelpers')
const { INDEXED, INCREMENTAL, NOT_INDEXED, NEVER_INDEXED, SIZE_UPDATE } = require('../../constants')
const { decodeInteger, encodeInteger } = require('./integer')
const { decodeStringLiteral } = require('./stringLiteral')

function _decodeIntegerIntoHeader (ui8a, header, name, bitOffset) {
  let decodedInteger = decodeInteger(ui8a, bitOffset, header.byteOffset)
  header[name] = decodedInteger.value
  header.byteOffset = decodedInteger.byteOffset
  return header
}

function _decodeStringLiteralIntoHeader (ui8a, header, name) {
  let decodedStringLiteral = decodeStringLiteral(ui8a, header.byteOffset)
  header[name] = decodedStringLiteral
  header.byteOffset = decodedStringLiteral.byteOffset
  return header
}

function _decodeLiteralHeader (ui8a, header, bitOffset) {
  _decodeIntegerIntoHeader(ui8a, header, 'index', bitOffset)
  if (!header.index) {
    _decodeStringLiteralIntoHeader(ui8a, header, 'name')
  }
  _decodeStringLiteralIntoHeader(ui8a, header, 'value')
}

function decodeHeader (ui8a, byteOffset = 0) {
  const firstByte = ui8aHelpers.readUInt8(ui8a, byteOffset)
  let header = { byteOffset }
  if (firstByte & NEVER_INDEXED) {
    header.kind = NEVER_INDEXED
    _decodeLiteralHeader(ui8a, header, 4)
  } else if (firstByte & SIZE_UPDATE) {
    header.kind = SIZE_UPDATE
    _decodeIntegerIntoHeader(ui8a, header, 'maxSize', 3)
  } else if (firstByte & INCREMENTAL) {
    header.kind = INCREMENTAL
    _decodeLiteralHeader(ui8a, header, 2)
  } else if (firstByte & INDEXED) {
    header.kind = INDEXED
    _decodeIntegerIntoHeader(ui8a, header, 'index', 1)
  } else {
    header.kind = NOT_INDEXED
    _decodeLiteralHeader(ui8a, header, 4)
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
